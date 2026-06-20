import { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import auditController from './audit.controller.js';

const AdminOrderController = {
  // Get all trades (admin only)
  getAllTrades: async (req, res, next) => {
    try {
      const { pair, limit = 50, offset = 0 } = req.query;

      let queryString = `
        SELECT
          t.id,
          tp.base_currency,
          tp.quote_currency,
          CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
          t.price,
          t.quantity,
          (t.price * t.quantity) as total,
          t.buyer_fee,
          t.seller_fee,
          t.executed_at,
          buyer.username as buyer_username,
          buyer.email as buyer_email,
          seller.username as seller_username,
          seller.email as seller_email,
          t.buy_order_id,
          t.sell_order_id
        FROM trades t
        JOIN trading_pairs tp ON t.pair_id = tp.id
        JOIN users buyer ON t.buyer_id = buyer.id
        JOIN users seller ON t.seller_id = seller.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Filter by pair
      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
          params.push(base, quote);
          paramIndex += 2;
        }
      }

      queryString += ` ORDER BY t.executed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryString, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM trades t
        JOIN trading_pairs tp ON t.pair_id = tp.id
        WHERE 1=1
      `;
      const countParams = [];
      let countParamIndex = 1;

      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          countQuery += ` AND tp.base_currency = $${countParamIndex} AND tp.quote_currency = $${countParamIndex + 1}`;
          countParams.push(base, quote);
        }
      }

      const countResult = await query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
        }
      });

      auditController.auditingSave(req, 'Viewed all trades', 'admin_trade_management', null, { pair, limit, offset })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Get all trades error:', error);
      next(error);
    }
  },

  // Get all orders (admin only)
  getAllOrders: async (req, res, next) => {
    try {
      const { status, pair, limit = 50, offset = 0 } = req.query;

      let queryString = `
        SELECT
          o.id,
          o.user_id,
          u.username,
          u.email,
          tp.base_currency,
          tp.quote_currency,
          CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
          o.type,
          o.side,
          o.status,
          o.price,
          o.quantity,
          o.filled_qty,
          o.avg_fill_price,
          o.fee,
          o.fee_currency,
          o.created_at,
          o.updated_at,
          o.cancelled_at
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        JOIN users u ON o.user_id = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Filter by status
      if (status && ['open', 'partially_filled', 'filled', 'cancelled'].includes(status)) {
        queryString += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Filter by pair
      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
          params.push(base, quote);
          paramIndex += 2;
        }
      }

      queryString += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryString, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        WHERE 1=1
      `;
      const countParams = [];
      let countParamIndex = 1;

      if (status && ['open', 'partially_filled', 'filled', 'cancelled'].includes(status)) {
        countQuery += ` AND o.status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }

      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          countQuery += ` AND tp.base_currency = $${countParamIndex} AND tp.quote_currency = $${countParamIndex + 1}`;
          countParams.push(base, quote);
        }
      }

      const countResult = await query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
        }
      });

      auditController.auditingSave(req, 'Viewed all orders', 'admin_order_management', null, { status, pair, limit, offset })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Get all orders error:', error);
      next(error);
    }
  },

  // Get open orders only (admin only)
  getOpenOrders: async (req, res, next) => {
    try {
      const { pair, limit = 50, offset = 0 } = req.query;

      let queryString = `
        SELECT
          o.id,
          o.user_id,
          u.username,
          u.email,
          tp.base_currency,
          tp.quote_currency,
          CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
          o.type,
          o.side,
          o.status,
          o.price,
          o.quantity,
          o.filled_qty,
          o.avg_fill_price,
          o.fee,
          o.fee_currency,
          o.created_at,
          o.updated_at
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        JOIN users u ON o.user_id = u.id
        WHERE o.status IN ('open', 'partially_filled')
      `;

      const params = [];
      let paramIndex = 1;

      // Filter by pair
      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
          params.push(base, quote);
          paramIndex += 2;
        }
      }

      queryString += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryString, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        WHERE o.status IN ('open', 'partially_filled')
      `;
      const countParams = [];
      let countParamIndex = 1;

      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          countQuery += ` AND tp.base_currency = $${countParamIndex} AND tp.quote_currency = $${countParamIndex + 1}`;
          countParams.push(base, quote);
        }
      }

      const countResult = await query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
        }
      });

      auditController.auditingSave(req, 'Viewed open orders', 'admin_order_management', null, { pair, limit, offset })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Get open orders error:', error);
      next(error);
    }
  },

  // Get order history (filled/cancelled, admin only)
  getOrderHistory: async (req, res, next) => {
    try {
      const { pair, limit = 50, offset = 0 } = req.query;

      let queryString = `
        SELECT
          o.id,
          o.user_id,
          u.username,
          u.email,
          tp.base_currency,
          tp.quote_currency,
          CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
          o.type,
          o.side,
          o.status,
          o.price,
          o.quantity,
          o.filled_qty,
          o.avg_fill_price,
          o.fee,
          o.fee_currency,
          o.created_at,
          o.updated_at,
          o.cancelled_at
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        JOIN users u ON o.user_id = u.id
        WHERE o.status IN ('filled', 'cancelled')
      `;

      const params = [];
      let paramIndex = 1;

      // Filter by pair
      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          queryString += ` AND tp.base_currency = $${paramIndex} AND tp.quote_currency = $${paramIndex + 1}`;
          params.push(base, quote);
          paramIndex += 2;
        }
      }

      queryString += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryString, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        WHERE o.status IN ('filled', 'cancelled')
      `;
      const countParams = [];
      let countParamIndex = 1;

      if (pair) {
        const [base, quote] = pair.split('/');
        if (base && quote) {
          countQuery += ` AND tp.base_currency = $${countParamIndex} AND tp.quote_currency = $${countParamIndex + 1}`;
          countParams.push(base, quote);
        }
      }

      const countResult = await query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
        }
      });

      auditController.auditingSave(req, 'Viewed order history', 'admin_order_management', null, { pair, limit, offset })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Get order history error:', error);
      next(error);
    }
  },

  // Get single order by id (admin only)
  getOrderById: async (req, res, next) => {
    try {
      const { orderId } = req.params;

      const result = await query(`
        SELECT
          o.id,
          o.user_id,
          u.username,
          u.email,
          tp.base_currency,
          tp.quote_currency,
          CONCAT(tp.base_currency, '/', tp.quote_currency) as pair,
          o.type,
          o.side,
          o.status,
          o.price,
          o.quantity,
          o.filled_qty,
          o.avg_fill_price,
          o.fee,
          o.fee_currency,
          o.created_at,
          o.updated_at,
          o.cancelled_at
        FROM orders o
        JOIN trading_pairs tp ON o.pair_id = tp.id
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `, [orderId]);

      if (result.rows.length === 0) {
        return next(new AppError('Order not found', 404));
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });

      auditController.auditingSave(req, 'Viewed order details', 'admin_order_management', orderId)
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Get order by id error:', error);
      next(error);
    }
  },

  // Cancel order (admin only)
  cancelOrder: async (req, res, next) => {
    try {
      const { orderId } = req.params;

      // First check if order exists and is cancelable
      const checkResult = await query(`
        SELECT o.status, o.user_id, u.username
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `, [orderId]);

      if (checkResult.rows.length === 0) {
        return next(new AppError('Order not found', 404));
      }

      const order = checkResult.rows[0];

      if (!['open', 'partially_filled'].includes(order.status)) {
        return next(new AppError('Order cannot be cancelled (current status: ' + order.status + ')', 400));
      }

      // Update order status to cancelled
      const updateResult = await query(`
        UPDATE orders
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP,
            cancelled_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [orderId]);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: updateResult.rows[0]
      });

      auditController.auditingSave(req, 'Cancelled order', 'admin_order_management', orderId, { userId: order.user_id, username: order.username })
        .catch((err) => console.error('Audit save failed:', err));
      return;
    } catch (error) {
      console.error('Cancel order error:', error);
      next(error);
    }
  },
};

export default AdminOrderController;
