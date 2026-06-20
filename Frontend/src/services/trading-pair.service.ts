import api, { API_ENDPOINTS } from './api.service';

export interface TradingPair {
  id: string;
  base_currency: string;
  quote_currency: string;
  min_order_size: number;
  max_order_size: number;
  price_precision: number;
  qty_precision: number;
  maker_fee: number;
  taker_fee: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTradingPairRequest {
  base_currency: string;
  quote_currency: string;
  min_order_size: number;
  max_order_size: number;
  price_precision?: number;
  qty_precision?: number;
  maker_fee?: number;
  taker_fee?: number;
  is_active?: boolean;
}

export interface UpdateTradingPairRequest extends Partial<CreateTradingPairRequest> {}

export interface TradingPairsResponse {
  success: boolean;
  message: string;
  data: TradingPair[];
}

export interface TradingPairResponse {
  success: boolean;
  message: string;
  data: TradingPair;
}

const transformTradingPair = (pair: any): TradingPair => {
  return {
    ...pair,
    min_order_size: Number(pair.min_order_size),
    max_order_size: Number(pair.max_order_size),
    price_precision: Number(pair.price_precision),
    qty_precision: Number(pair.qty_precision),
    maker_fee: Number(pair.maker_fee),
    taker_fee: Number(pair.taker_fee),
  };
};

export const tradingPairService = {
  getAllPairs: async (includeInactive: boolean = false): Promise<TradingPairsResponse> => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    
    const response = await api.get(`${API_ENDPOINTS.TRADING_PAIRS.GET_ALL}?${params.toString()}`);
    return {
      ...response.data,
      data: response.data.data.map(transformTradingPair)
    };
  },

  getPairById: async (id: string): Promise<TradingPairResponse> => {
    const response = await api.get(API_ENDPOINTS.TRADING_PAIRS.GET_BY_ID(id));
    return {
      ...response.data,
      data: transformTradingPair(response.data.data)
    };
  },

  createPair: async (data: CreateTradingPairRequest): Promise<TradingPairResponse> => {
    const response = await api.post(API_ENDPOINTS.TRADING_PAIRS.CREATE, data);
    return {
      ...response.data,
      data: transformTradingPair(response.data.data)
    };
  },

  updatePair: async (id: string, data: UpdateTradingPairRequest): Promise<TradingPairResponse> => {
    const response = await api.put(API_ENDPOINTS.TRADING_PAIRS.UPDATE(id), data);
    return {
      ...response.data,
      data: transformTradingPair(response.data.data)
    };
  },

  deletePair: async (id: string): Promise<TradingPairResponse> => {
    const response = await api.delete(API_ENDPOINTS.TRADING_PAIRS.DELETE(id));
    return {
      ...response.data,
      data: transformTradingPair(response.data.data)
    };
  }
};

export default tradingPairService;
