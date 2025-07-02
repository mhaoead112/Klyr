export interface User {
  user_id: string;
  name: string;
  email: string;
  balance: number;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'topup' | 'withdraw' | 'split' | 'group';
  amount: number;
  description: string;
  date: string;
  from?: string;
  to?: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
}

export interface VirtualCard {
  id: string;
  user_id: string;
  card_number: string;
  card_holder: string;
  expiry_date: string;
  cvv: string;
  balance: number;
  status: 'active' | 'frozen' | 'expired';
  created_at: string;
}

export interface Group {
  group_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  members: GroupMember[];
  goals: Goal[];
  total_balance: number;
  avatar?: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Goal {
  goal_id: string;
  group_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  created_by: string;
  created_at: string;
  status: 'active' | 'completed' | 'paused';
  contributions: Contribution[];
  expenses: Expense[];
}

export interface Contribution {
  contribution_id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note?: string;
  created_at: string;
  user?: User;
}

export interface Expense {
  expense_id: string;
  goal_id: string;
  paid_by_user_id: string;
  amount: number;
  note: string;
  created_at: string;
  user?: User;
  split_members?: string[];
}

export interface Bill {
  bill_id: string;
  title: string;
  amount: number;
  created_by: string;
  group_id?: string;
  split_type: 'equal' | 'custom' | 'percentage';
  participants: BillParticipant[];
  status: 'pending' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
}

export interface BillParticipant {
  id: string;
  bill_id: string;
  user_id: string;
  user: User;
  amount_owed: number;
  amount_paid: number;
  status: 'pending' | 'paid';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}