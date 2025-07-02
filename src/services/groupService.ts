import { Group, Goal, Contribution, Expense, Bill } from '../types';
import { authService } from './authService';

class GroupService {
  API_URL = 'http://localhost:3001/api';

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

  async getUserGroups(userId: string): Promise<Group[]> {
    const response = await fetch(`${this.API_URL}/groups/user/${userId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    return response.json();
  }

  async createGroup(name: string, description: string, userId: string): Promise<Group> {
    const response = await fetch(`${this.API_URL}/groups`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ name, description, owner_id: userId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create group');
    }
    const data = await response.json();
    return data.group;
  }

  async getGroup(groupId: string): Promise<Group | null> {
    const response = await fetch(`${this.API_URL}/groups/${groupId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) {
      console.error(`Failed to fetch group ${groupId}`);
      return null;
    }
    return response.json();
  }

  async createGoal(groupId: string, title: string, targetAmount: number, deadline: string, userId: string): Promise<Goal> {
    const response = await fetch(`${this.API_URL}/goals`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ groupId, title, targetAmount, deadline, userId })
    });
    if (!response.ok) throw new Error('Failed to create goal');
    return response.json();
  }

  async addContribution(goalId: string, userId: string, amount: number, note?: string): Promise<Contribution> {
    const response = await fetch(`${this.API_URL}/contributions`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ goalId, userId, amount, note })
    });
    if (!response.ok) throw new Error('Failed to add contribution');
    return response.json();
  }

  async addExpense(goalId: string, userId: string, amount: number, note: string): Promise<Expense> {
    const response = await fetch(`${this.API_URL}/expenses`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ goalId, userId, amount, note })
    });
    if (!response.ok) throw new Error('Failed to add expense');
    return response.json();
  }

  async inviteToGroup(groupId: string, email: string): Promise<boolean> {
    const response = await fetch(`${this.API_URL}/groups/invite`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ groupId, email })
    });
    if (!response.ok) return false;
    return true;
  }

  async createBill(title: string, amount: number, createdBy: string, groupId: string, participantIds: string[]): Promise<Bill> {
    const response = await fetch(`${this.API_URL}/bills`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ title, amount, createdBy, groupId, participantIds })
    });
    if (!response.ok) throw new Error('Failed to create bill');
    return response.json();
  }

  async getUserBills(userId: string): Promise<Bill[]> {
    const response = await fetch(`${this.API_URL}/bills/user/${userId}`, { headers: this._getAuthHeadersForGet() });
    if (!response.ok) throw new Error('Failed to fetch bills');
    return response.json();
  }

  async payBill(billId: string, userId: string): Promise<boolean> {
    const response = await fetch(`${this.API_URL}/bills/pay`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ billId, userId })
    });
    if (!response.ok) return false;
    return true;
  }
}

export const groupService = new GroupService();