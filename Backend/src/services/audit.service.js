import { query } from '../config/db.config.js';

const auditService = {
    createAudit: async ({
        userId = null,
        action,
        entityType,
        entityId = null,
        metadata = null,
        ipAddress = null,
    }) => {
        if (!action || !entityType) {
            throw new Error('Audit save requires action and entityType');
        }

        const text = `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`;
        const values = [userId, action, entityType, entityId, ipAddress, metadata];

        const result = await query(text, values);
        return result.rows[0];
    },

   getAudits: async ({ page = 1, pageSize = 20, userId = null, search = null }) => {
    const offset = (page - 1) * pageSize;
    const searchValue = search ? `%${search}%` : null;

    const dataQuery = `
        SELECT audit_logs.*, u.username AS user_name, u.email AS user_email,
               COUNT(*) OVER()::int AS total_count
        FROM audit_logs
        LEFT JOIN users u ON audit_logs.user_id = u.id
        WHERE ($1::uuid IS NULL OR audit_logs.user_id = $1)
          AND ($4::text IS NULL OR (
                audit_logs.action ILIKE $4 OR
                audit_logs.entity_type ILIKE $4 OR
                u.username ILIKE $4 OR
                u.email ILIKE $4 OR
                audit_logs.ip_address::text ILIKE $4 OR
                audit_logs.metadata::text ILIKE $4
            ))
        ORDER BY audit_logs.created_at DESC
        LIMIT $2 OFFSET $3
    `;

    const { rows } = await query(dataQuery, [userId, pageSize, offset, searchValue]);

    const totalCount = rows[0]?.total_count ?? 0;
    const audits = rows.map(({ total_count, ...audit }) => audit);

    return {
        audits,
        totalCount,
    };
},
};

export default auditService;
