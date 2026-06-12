import api from './api.service';

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  logo?: string;
  status: 'enabled' | 'disabled';
  price?: number;
  created_at: string;
  updated_at: string;
}

export interface SupportedSymbol {
  symbol: string;
  name: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: {
    imported: Currency[];
    skipped: Array<{ symbol: string; reason: string }>;
    errors: Array<{ symbol: string; reason: string }>;
  };
}

const currencyService = {
  // ─── GET ALL CURRENCIES ─────────────────────────────────────────────────────

  /**
   * Get all currencies with live prices
   * @param includeDisabled - Include disabled currencies
   */
  getAllCurrencies: async (includeDisabled: boolean = true) => {
    const response = await api.get('/admin/currencies', {
      params: { includeDisabled: includeDisabled ? 'true' : 'false' },
    });
    return response.data;
  },

  // ─── GET SINGLE CURRENCY ────────────────────────────────────────────────────

  /**
   * Get currency by ID
   * @param id - Currency UUID
   */
  getCurrency: async (id: string) => {
    const response = await api.get(`/admin/currencies/${id}`);
    return response.data;
  },

  // ─── CREATE CURRENCY ────────────────────────────────────────────────────────

  /**
   * Create new currency
   * @param data - Currency data
   */
  createCurrency: async (data: {
    name: string;
    symbol: string;
    logo?: string;
    status?: 'enabled' | 'disabled';
  }) => {
    const response = await api.post('/admin/currencies', data);
    return response.data;
  },

  // ─── UPDATE CURRENCY ────────────────────────────────────────────────────────

  /**
   * Update currency
   * @param id - Currency UUID
   * @param data - Updated fields
   */
  updateCurrency: async (
    id: string,
    data: {
      name?: string;
      symbol?: string;
      logo?: string;
      status?: 'enabled' | 'disabled';
    }
  ) => {
    const response = await api.put(`/admin/currencies/${id}`, data);
    return response.data;
  },

  // ─── UPDATE STATUS ──────────────────────────────────────────────────────────

  /**
   * Update currency status (enable/disable)
   * @param id - Currency UUID
   * @param status - New status
   */
  updateStatus: async (id: string, status: 'enabled' | 'disabled') => {
    const response = await api.patch(`/admin/currencies/${id}/status`, {
      status,
    });
    return response.data;
  },

  // ─── DELETE CURRENCY ────────────────────────────────────────────────────────

  /**
   * Delete currency
   * @param id - Currency UUID
   */
  deleteCurrency: async (id: string) => {
    const response = await api.delete(`/admin/currencies/${id}`);
    return response.data;
  },

  // ─── BULK IMPORT ────────────────────────────────────────────────────────────

  /**
   * Bulk import currencies from symbols
   * @param symbols - Array of symbols to import
   */
  bulkImport: async (symbols: string[]) => {
    const response = await api.post('/admin/currencies/import', {
      symbols,
    });
    return response.data;
  },

  // ─── GET SUPPORTED SYMBOLS ──────────────────────────────────────────────────

  /**
   * Get list of supported symbols for import
   */
  getSupportedSymbols: async () => {
    const response = await api.get('/admin/currencies/supported');
    return response.data;
  },
};

export default currencyService;
