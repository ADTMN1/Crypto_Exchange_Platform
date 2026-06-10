import pool, { query } from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';
import walletService from './wallet.service.js';

const p2pService = {

  // ─── OFFERS ─────────────────────────────────────────────────────────────────

  createOffer: async (userId, offerData) => {
    const { type, cryptoCurrency, fiatCurrency, price, minAmount, maxAmount, paymentMethods, terms } = offerData;

    if (!type || !cryptoCurrency || !fiatCurrency || !price || !minAmount || !maxAmount) {
      throw new AppError('All required fields must be provided', 400);
    }

    if (type !== 'buy' && type !== 'sell') {
      throw new AppError('Type must be buy or sell', 400);
    }

    if (parseFloat(minAmount) <= 0 || parseFloat(maxAmount) <= 0) {
      throw new AppError('Amounts must be positive', 400);
    }

    if (parseFloat(minAmount) > parseFloat(maxAmount)) {
      throw new AppError('Min amount cannot exceed max amount', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If selling, lock the crypto immediately
      if (type === 'sell') {
        await walletService.lock(userId, cryptoCurrency, parseFloat(maxAmount), client);
      }

      const result = await client.query(
        `INSERT INTO p2p_offers 
         (user_id, type, crypto_currency, fiat_currency, price, min_amount, max_amount, 
          available_amount, payment_methods, terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9)
         RETURNING *`,
        [userId, type, cryptoCurrency, fiatCurrency, price, minAmount, maxAmount, paymentMethods, terms]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getOffers: async (filters = {}, page = 1, limit = 20) => {
    const { type, pair } = filters;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = 'WHERE is_active = TRUE AND available_amount > 0';

    if (type) {
      params.push(type);
      whereClause += ` AND type = $${params.length}`;
    }

    if (pair) {
      const [crypto, fiat] = pair.split('/');
      params.push(crypto, fiat);
      whereClause += ` AND crypto_currency = $${params.length - 1} AND fiat_currency = $${params.length}`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT p.id, p.user_id, u.username,
              p.type, p.crypto_currency, p.fiat_currency, p.price,
              p.min_amount, p.max_amount, p.available_amount,
              p.payment_methods, p.terms, p.created_at
       FROM p2p_offers p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM p2p_offers p ${whereClause}`,
      countParams
    );

    return {
      offers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  // ─── ORDERS ─────────────────────────────────────────────────────────────────

  placeOrder: async (buyerId, offerId, cryptoAmount) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get offer details with lock
      const offerResult = await client.query(
        `SELECT * FROM p2p_offers WHERE id = $1 AND is_active = TRUE FOR UPDATE`,
        [offerId]
      );

      if (offerResult.rows.length === 0) {
        throw new AppError('Offer not found or inactive', 404);
      }

      const offer = offerResult.rows[0];

      // Validate amount
      if (cryptoAmount < parseFloat(offer.min_amount) || cryptoAmount > parseFloat(offer.max_amount)) {
        throw new AppError(`Amount must be between ${offer.min_amount} and ${offer.max_amount}`, 400);
      }

      if (cryptoAmount > parseFloat(offer.available_amount)) {
        throw new AppError('Insufficient available amount', 400);
      }

      // Can't buy from yourself
      if (offer.user_id === buyerId) {
        throw new AppError('Cannot place order on your own offer', 400);
      }

      const fiatAmount = cryptoAmount * parseFloat(offer.price);

      // Determine buyer and seller based on offer type
      let actualBuyerId, actualSellerId;
      if (offer.type === 'sell') {
        actualBuyerId = buyerId;
        actualSellerId = offer.user_id;
      } else {
        actualBuyerId = offer.user_id;
        actualSellerId = buyerId;
        // If offer is 'buy', the person placing order is selling, so lock their crypto
        await walletService.lock(buyerId, offer.crypto_currency, cryptoAmount, client);
      }

      // Create order
      const orderResult = await client.query(
        `INSERT INTO p2p_orders 
         (offer_id, buyer_id, seller_id, crypto_currency, fiat_currency, 
          crypto_amount, fiat_amount, price, status, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
         RETURNING *`,
        [offerId, actualBuyerId, actualSellerId, offer.crypto_currency, offer.fiat_currency,
         cryptoAmount, fiatAmount, offer.price, offer.payment_methods]
      );

      // Update offer available amount
      await client.query(
        `UPDATE p2p_offers SET available_amount = available_amount - $1 WHERE id = $2`,
        [cryptoAmount, offerId]
      );

      await client.query('COMMIT');
      return orderResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  markAsPaid: async (orderId, buyerId) => {
    const result = await query(
      `UPDATE p2p_orders
       SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND buyer_id = $2 AND status = 'pending'
       RETURNING *`,
      [orderId, buyerId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found or cannot be updated', 404);
    }

    return result.rows[0];
  },

  releaseCrypto: async (orderId, sellerId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        `SELECT * FROM p2p_orders WHERE id = $1 AND seller_id = $2 AND status = 'paid' FOR UPDATE`,
        [orderId, sellerId]
      );

      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found or cannot be released', 404);
      }

      const order = orderResult.rows[0];

      // Burn from seller
      await walletService.burn(order.seller_id, order.crypto_currency, parseFloat(order.crypto_amount), client);

      // Credit to buyer
      await walletService.credit(
        order.buyer_id,
        order.crypto_currency,
        parseFloat(order.crypto_amount),
        `P2P_ORDER_${orderId}`,
        client
      );

      // Update order status
      await client.query(
        `UPDATE p2p_orders
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderId]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  cancelOrder: async (orderId, userId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        `SELECT * FROM p2p_orders 
         WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2) AND status = 'pending' 
         FOR UPDATE`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        throw new AppError('Order not found or cannot be cancelled', 404);
      }

      const order = orderResult.rows[0];

      // Determine who had crypto locked
      const offerResult = await client.query(
        `SELECT type, user_id FROM p2p_offers WHERE id = $1`,
        [order.offer_id]
      );

      if (offerResult.rows.length > 0) {
        const offer = offerResult.rows[0];
        
        // Release locked crypto back to original locker
        if (offer.type === 'sell') {
          // Seller locked, release back to seller
          await walletService.release(order.seller_id, order.crypto_currency, parseFloat(order.crypto_amount), client);
        } else {
          // Buyer locked (person who placed order), release back
          await walletService.release(order.seller_id, order.crypto_currency, parseFloat(order.crypto_amount), client);
        }

        // Return amount to offer
        await client.query(
          `UPDATE p2p_offers SET available_amount = available_amount + $1 WHERE id = $2`,
          [order.crypto_amount, order.offer_id]
        );
      }

      // Update order status
      await client.query(
        `UPDATE p2p_orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [orderId]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  raiseDispute: async (orderId, userId) => {
    const result = await query(
      `UPDATE p2p_orders
       SET status = 'disputed', disputed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2) AND status IN ('pending', 'paid')
       RETURNING *`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found or cannot be disputed', 404);
    }

    return result.rows[0];
  },

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  getAllOrders: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT o.id, o.offer_id, o.buyer_id, o.seller_id,
              ub.username as buyer_username, us.username as seller_username,
              o.crypto_currency, o.fiat_currency, o.crypto_amount, o.fiat_amount,
              o.price, o.status, o.created_at, o.paid_at, o.completed_at
       FROM p2p_orders o
       JOIN users ub ON o.buyer_id = ub.id
       JOIN users us ON o.seller_id = us.id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM p2p_orders`);

    return {
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  getDisputes: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT o.id, o.offer_id, o.buyer_id, o.seller_id,
              ub.username as buyer_username, us.username as seller_username,
              o.crypto_currency, o.fiat_currency, o.crypto_amount, o.fiat_amount,
              o.price, o.status, o.admin_note, o.created_at, o.disputed_at
       FROM p2p_orders o
       JOIN users ub ON o.buyer_id = ub.id
       JOIN users us ON o.seller_id = us.id
       WHERE o.status = 'disputed'
       ORDER BY o.disputed_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM p2p_orders WHERE status = 'disputed'`
    );

    return {
      disputes: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  resolveDispute: async (orderId, decision, adminNote) => {
    if (decision !== 'release_to_buyer' && decision !== 'return_to_seller') {
      throw new AppError('Decision must be release_to_buyer or return_to_seller', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        `SELECT * FROM p2p_orders WHERE id = $1 AND status = 'disputed' FOR UPDATE`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new AppError('Disputed order not found', 404);
      }

      const order = orderResult.rows[0];

      if (decision === 'release_to_buyer') {
        // Burn from seller and credit to buyer
        await walletService.burn(order.seller_id, order.crypto_currency, parseFloat(order.crypto_amount), client);
        await walletService.credit(
          order.buyer_id,
          order.crypto_currency,
          parseFloat(order.crypto_amount),
          `P2P_DISPUTE_RESOLVED_${orderId}`,
          client
        );

        await client.query(
          `UPDATE p2p_orders
           SET status = 'completed', admin_note = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [adminNote, orderId]
        );
      } else {
        // Return to seller
        await walletService.release(order.seller_id, order.crypto_currency, parseFloat(order.crypto_amount), client);

        // Return amount to offer
        await client.query(
          `UPDATE p2p_offers SET available_amount = available_amount + $1 WHERE id = $2`,
          [order.crypto_amount, order.offer_id]
        );

        await client.query(
          `UPDATE p2p_orders
           SET status = 'cancelled', admin_note = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [adminNote, orderId]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get user's orders (both as buyer and seller)
  getMyOrders: async (userId, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT o.id, o.offer_id, o.buyer_id, o.seller_id,
              ub.username as buyer_username, us.username as seller_username,
              o.crypto_currency, o.fiat_currency, o.crypto_amount, o.fiat_amount,
              o.price, o.status, o.payment_method, o.created_at, o.paid_at, o.completed_at
       FROM p2p_orders o
       JOIN users ub ON o.buyer_id = ub.id
       JOIN users us ON o.seller_id = us.id
       WHERE o.buyer_id = $1 OR o.seller_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM p2p_orders WHERE buyer_id = $1 OR seller_id = $1`,
      [userId]
    );

    return {
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },
};

export default p2pService;
