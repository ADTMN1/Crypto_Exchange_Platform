import api from './api.service';

export interface TradingGateStatus {
  id: string;
  status: 'open' | 'closed';
  changedBy: string;
  changedAt: string;
}

export interface TradingGateDetails extends TradingGateStatus {
  isOpen: boolean;
  createdAt?: string;
}

class TradingGateService {
  private baseURL = '/trading-gate';

  /**
   * Get current trading gate status (public endpoint)
   */
  async getStatus(): Promise<TradingGateStatus> {
    const response = await api.get(`${this.baseURL}/status`);
    return response.data;
  }

  /**
   * Get detailed trading gate information (admin only)
   */
  async getDetails(): Promise<TradingGateDetails> {
    const response = await api.get(`${this.baseURL}/details`);
    return response.data.data; // Extract from nested data property
  }

  /**
   * Open the trading gate (admin only)
   */
  async openGate(): Promise<TradingGateDetails> {
    const response = await api.post(`${this.baseURL}/open`);
    return response.data.data; // Extract from nested data property
  }

  /**
   * Close the trading gate (admin only)
   */
  async closeGate(): Promise<TradingGateDetails> {
    const response = await api.post(`${this.baseURL}/close`);
    return response.data.data; // Extract from nested data property
  }
}

export const tradingGateService = new TradingGateService();
export default tradingGateService;