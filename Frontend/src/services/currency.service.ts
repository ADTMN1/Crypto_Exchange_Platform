import api, { API_ENDPOINTS } from './api.service';

export interface Currency {
  id: string;
  symbol: string;
  name: string;
  status: 'enabled' | 'disabled';
  decimals: number;
  icon?: string;
  is_crypto: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCurrencyRequest {
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  is_crypto: boolean;
}

export interface UpdateCurrencyRequest extends Partial<CreateCurrencyRequest> {}

export interface CurrenciesResponse {
  success: boolean;
  message: string;
  data: Currency[];
}

export interface CurrencyResponse {
  success: boolean;
  message: string;
  data: Currency;
}

const currencyService = {
  getAllCurrencies: async (includeDisabled: boolean = false): Promise<CurrenciesResponse> => {
    const params = new URLSearchParams();
    if (includeDisabled) params.append('includeDisabled', 'true');
    
    const response = await api.get(`${API_ENDPOINTS.CURRENCY.GET_ALL}?${params.toString()}`);
    return response.data;
  },

  getSupportedSymbols: async (): Promise<CurrenciesResponse> => {
    const response = await api.get(API_ENDPOINTS.CURRENCY.GET_SUPPORTED);
    return response.data;
  },

  getCurrencyById: async (id: string): Promise<CurrencyResponse> => {
    const response = await api.get(API_ENDPOINTS.CURRENCY.GET_BY_ID(id));
    return response.data;
  },

  createCurrency: async (data: CreateCurrencyRequest): Promise<CurrencyResponse> => {
    const response = await api.post(API_ENDPOINTS.CURRENCY.CREATE, data);
    return response.data;
  },

  updateCurrency: async (id: string, data: UpdateCurrencyRequest): Promise<CurrencyResponse> => {
    const response = await api.put(API_ENDPOINTS.CURRENCY.UPDATE(id), data);
    return response.data;
  },

  updateStatus: async (id: string, status: 'enabled' | 'disabled'): Promise<CurrencyResponse> => {
    const response = await api.patch(API_ENDPOINTS.CURRENCY.UPDATE_STATUS(id), { status });
    return response.data;
  },

  deleteCurrency: async (id: string): Promise<CurrencyResponse> => {
    const response = await api.delete(API_ENDPOINTS.CURRENCY.DELETE(id));
    return response.data;
  }
};

export default currencyService;
