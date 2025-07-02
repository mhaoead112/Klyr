import { Transaction, VirtualCard, User } from '../types';
import { authService } from './authService';

const API_URL = 'http://localhost:3001/api';

class BankingService {
  private _getAuthHeaders() {
    const token = authService.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private _getAuthHeadersForGet() {
    const token = authService.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getInsights(userId: string): Promise<{ total_storage: number, total_transactions: number, last_activity: string }> {
    const response = await fetch(`${API_URL}/insights/${userId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) {
      throw new Error('Failed to fetch insights');
    }
    return response.json();
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const response = await fetch(`${API_URL}/banking/transactions/${userId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  }

  async topUpBalance(amount: number, method: string): Promise<{ message: string, user: User }> {
    const response = await fetch(`${API_URL}/banking/topup`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ amount, method }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to top up balance');
    }

    return response.json();
  }

  async sendMoney(fromUserId: string, toEmail: string, amount: number, description: string): Promise<{ message: string, user: User }> {
    const response = await fetch(`${API_URL}/banking/send`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ fromUserId, toEmail, amount, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send money');
    }

    return response.json();
  }

  async withdrawMoney(amount: number, method: string): Promise<{ message: string, user: User }> {
    const response = await fetch(`${API_URL}/banking/withdraw`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ amount, method }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to withdraw money');
    }

    return response.json();
  }

  async getUserCards(userId: string): Promise<VirtualCard[]> {
    const response = await fetch(`${API_URL}/banking/cards/${userId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) {
      throw new Error('Failed to fetch virtual cards');
    }
    return response.json();
  }

  async createVirtualCard(userId: string, cardHolder: string, balance: number): Promise<{ message: string, card: VirtualCard, user: User }> {
    const response = await fetch(`${API_URL}/banking/cards`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ 
        userId,
        card_holder_name: cardHolder, 
        balance 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create virtual card');
    }
    return response.json();
  }

  async deleteVirtualCard(cardId: string, userId: string): Promise<{ message: string, user: User }> {
    const response = await fetch(`${API_URL}/banking/cards/${cardId}`, {
      method: 'DELETE',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete virtual card');
    }
    return response.json();
  }

  async topUpVirtualCard(cardId: string, userId: string, amount: number): Promise<{ message: string, user: User, card: VirtualCard }> {
    const response = await fetch(`${API_URL}/banking/cards/${cardId}/topup`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ userId, amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to top up virtual card');
    }
    return response.json();
  }
}

export const bankingService = new BankingService();