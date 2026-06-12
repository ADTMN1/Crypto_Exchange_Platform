import api from './api.service';

export interface CreateOfferRequest {
  type: 'buy' | 'sell';
  cryptoCurrency: string;
  fiatCurrency: string;
  price: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods?: string;
  terms?: string;
}

export interface PlaceOrderRequest {
  offerId: string;
  cryptoAmount: number;
}

export interface P2POffer {
  id: string;
  user_id: string;
  username: string;
  type: 'buy' | 'sell';
  crypto_currency: string;
  fiat_currency: string;
  price: string;
  min_amount: string;
  max_amount: string;
  available_amount: string;
  payment_methods: string;
  terms: string;
  is_active: boolean;
  created_at: string;
}

export interface P2POrder {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_username: string;
  seller_username: string;
  crypto_currency: string;
  fiat_currency: string;
  crypto_amount: string;
  fiat_amount: string;
  price: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed';
  payment_method: string;
  admin_note?: string;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
  disputed_at?: string;
}

const p2pService = {
  // ─── OFFER ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Create a P2P offer
   * @param offerData - Offer parameters
   */
  createOffer: async (offerData: CreateOfferRequest) => {
    const response = await api.post('/p2p/offer', offerData);
    return response.data;
  },

  /**
   * Get all P2P offers
   * @param filters - Optional filters (type, pair)
   * @param page - Page number
   */
  getOffers: async (filters?: { type?: string; pair?: string }, page: number = 1) => {
    const response = await api.get('/p2p/offers', {
      params: { ...filters, page },
    });
    return response.data;
  },

  // ─── ORDER ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Place an order on a P2P offer
   * @param orderData - Order parameters
   */
  placeOrder: async (orderData: PlaceOrderRequest) => {
    const response = await api.post('/p2p/order', orderData);
    return response.data;
  },

  /**
   * Get user's P2P orders (as buyer or seller)
   * @param page - Page number
   */
  getMyOrders: async (page: number = 1) => {
    const response = await api.get('/p2p/orders', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Buyer: Mark order as paid
   * @param orderId - Order UUID
   */
  markAsPaid: async (orderId: string) => {
    const response = await api.post(`/p2p/order/${orderId}/paid`, {});
    return response.data;
  },

  /**
   * Seller: Release crypto to buyer
   * @param orderId - Order UUID
   */
  releaseCrypto: async (orderId: string) => {
    const response = await api.post(`/p2p/order/${orderId}/release`, {});
    return response.data;
  },

  /**
   * Cancel order (buyer or seller)
   * @param orderId - Order UUID
   */
  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/p2p/order/${orderId}/cancel`, {});
    return response.data;
  },

  /**
   * Raise a dispute (buyer or seller)
   * @param orderId - Order UUID
   */
  raiseDispute: async (orderId: string) => {
    const response = await api.post(`/p2p/order/${orderId}/dispute`, {});
    return response.data;
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Admin: Get all P2P orders
   * @param page - Page number
   */
  getAllOrders: async (page: number = 1) => {
    const response = await api.get('/p2p/admin/orders', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Admin: Get disputed orders
   * @param page - Page number
   */
  getDisputes: async (page: number = 1) => {
    const response = await api.get('/p2p/admin/disputes', {
      params: { page },
    });
    return response.data;
  },

  /**
   * Admin: Resolve a dispute
   * @param orderId - Order UUID
   * @param decision - 'release_to_buyer' or 'return_to_seller'
   * @param adminNote - Optional admin note
   */
  resolveDispute: async (orderId: string, decision: string, adminNote?: string) => {
    const response = await api.post(`/p2p/admin/dispute/${orderId}/resolve`, {
      decision,
      adminNote,
    });
    return response.data;
  },
};

export default p2pService;
