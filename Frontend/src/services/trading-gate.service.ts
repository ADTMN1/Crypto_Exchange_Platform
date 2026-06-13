import api from './api.service';

export interface TradingGateStatus {
  id: string;
  status: 'open' | 'closed';
  changed_by: string;
  changed_at: string;
}

export interface TradingGateDetails extends TradingGateStatus {
  // Additional fields if needed
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
    return response.data;
  }

  /**
   * Open the trading gate (admin only)
   */
  async openGate(): Promise<TradingGateDetails> {
    const response = await api.post(`${this.baseURL}/open`);
    return response.data;
  }

  /**
   * Close the trading gate (admin only)
   */
  async closeGate(): Promise<TradingGateDetails> {
    const response = await api.post(`${this.baseURL}/close`);
    return response.data;
  }
}

export const tradingGateService = new TradingGateService();
export default tradingGateService;