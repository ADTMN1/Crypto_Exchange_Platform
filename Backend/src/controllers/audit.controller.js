import AppError from '../utils/errorHandling.js';
import auditService from '../services/audit.service.js';

const getRequestIp = (req) => {
    if (!req || typeof req !== 'object') return null;

    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        const firstIp = forwarded.split(',')[0].trim();
        if (firstIp) return firstIp;
    }

    const realIp = req.headers?.['x-real-ip'];
    if (realIp) return realIp;

    if (req.ip) return req.ip;
    if (req.socket?.remoteAddress) return req.socket.remoteAddress;
    if (req.connection?.remoteAddress) return req.connection.remoteAddress;

    return null;
};

const auditController = {
    auditingSave: async (reqOrIp, action, entityType, entityId = null, metadata = null, explicitUserId = null) => {
        // Support two calling conventions:
        // 1) auditingSave(req, action, entityType, entityId, metadata, explicitUserId)
        // 2) auditingSave(ipAddressString, action, entityType, entityId, metadata)
        if (!action || !entityType) {
            throw new AppError('Audit save requires action and entity type', 400);
        }

        let req = null;
        let explicitIp = null;
        if (typeof reqOrIp === 'string') {
            explicitIp = reqOrIp;
        } else if (reqOrIp && typeof reqOrIp === 'object') {
            req = reqOrIp;
        }

        // Use explicitly passed userId first, then fall back to req.user.id (for authenticated routes)
        const userId = explicitUserId || req?.user?.id || null;
        const ipAddress = explicitIp || getRequestIp(req);

        return await auditService.createAudit({
            userId,
            action,
            entityType,
            entityId,
            metadata,
            ipAddress,
        });
    },

    loginHistoryFetch: async (req, res, next) => {
        try {
            const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const userId = req.query.userId?.trim() || null;
            const search = req.query.search?.toString().trim() || null;

            const { records, totalCount } = await auditService.getLoginHistory({
                page,
                pageSize: limit,
                userId,
                search,
            });

            return res.status(200).json({
                success: true,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(totalCount / limit)),
                totalCount,
                data: records,
            });
        } catch (error) {
            next(error);
        }
    },

    auditingFetch: async (req, res, next) => {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const isAdmin = req.user?.role === 'admin';

            // If the request includes an explicit `userId` query parameter, use it (allow null/empty).
            // If not provided and the requester is an admin, allow `requestedUserId` to be null
            // so the service will return all audit logs. For non-admins default to the
            // requesting user's id to restrict access to their own logs.
            const requestedUserId = Object.prototype.hasOwnProperty.call(req.query, 'userId')
                ? (req.query.userId || null)
                : (isAdmin ? null : req.user?.id);

            const search = req.query.search?.toString().trim() || null;

            if (!isAdmin && requestedUserId !== req.user?.id) {
                throw new AppError('Not authorized to view other users audit logs', 403);
            }

            const { audits, totalCount } = await auditService.getAudits({
                page,
                pageSize: limit,
                userId: requestedUserId,
                isAdmin,
                search,
            });

            const totalPages = Math.max(1, Math.ceil(totalCount / limit));

            return res.status(200).json({
                success: true,
                page,
                limit,
                totalPages,
                totalCount,
                data: audits,
            });
        } catch (error) {
            next(error);
        }
    },
};

export default auditController;
