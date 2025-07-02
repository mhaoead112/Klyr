import React, { useEffect, useState } from 'react';
import {
  Plus,
  Send,
  Download,
  Upload,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  PiggyBank,
  BarChart3,
  Activity,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bankingService } from '../services/bankingService';
import { Transaction, VirtualCard } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export const PersonalCloud: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [insights, setInsights] = useState<{ total_storage: number; total_transactions: number; last_activity: string } | null>(null);

  const [showSendModal, setShowSendModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);

  const [sendForm, setSendForm] = useState({ email: '', amount: '', description: '' });
  const [topUpForm, setTopUpForm] = useState({ 
    amount: '', 
    method: 'bank',
    paypalEmail: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    iban: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({ 
    amount: '', 
    method: 'bank',
    paypalEmail: ''
  });
  const [createCardForm, setCreateCardForm] = useState({ balance: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Generate demo IBAN
  const demoIban = 'GB29 NWBK 6016 1331 9268 19';

  useEffect(() => {
    if (user) {
      loadData();
      loadInsights();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [transactionsData, cardsData] = await Promise.all([
        bankingService.getTransactions(user.user_id),
        bankingService.getUserCards(user.user_id),
      ]);
      setTransactions(transactionsData);
      setCards(cardsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    if (!user) return;
    try {
      const data = await bankingService.getInsights(user.user_id);
      setInsights(data);
    } catch (error) {
      showToast('Failed to load insights', 'error');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCardNumber = (cardNumber: string) => {
    // Remove spaces and check if it's 16 digits
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleanNumber);
  };

  const validateExpiryDate = (expiry: string) => {
    // Format: MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    
    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return false;
    
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
  };

  const validateCVV = (cvv: string) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateIban = (iban: string) => {
    // Simple validation - remove spaces and check basic format
    const cleanIban = iban.replace(/\s/g, '');
    return cleanIban.length >= 15 && cleanIban.length <= 34 && /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIban);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return cleanValue.replace(/(.{4})/g, '$1 ').trim().slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleanValue.length >= 2) {
      return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIbanCopied(true);
      showToast('IBAN copied to clipboard!', 'success');
      setTimeout(() => setIbanCopied(false), 2000);
    });
  };

  const validateTopUpForm = () => {
    if (!topUpForm.amount) return false;
    
    switch (topUpForm.method) {
      case 'paypal':
        return validateEmail(topUpForm.paypalEmail);
      case 'card':
        return (
          validateCardNumber(topUpForm.cardNumber) &&
          validateExpiryDate(topUpForm.expiryDate) &&
          validateCVV(topUpForm.cvv) &&
          topUpForm.cardholderName.trim().length > 0
        );
      case 'bank':
        return validateIban(topUpForm.iban);
      default:
        return true;
    }
  };

  const validateWithdrawForm = () => {
    if (!withdrawForm.amount) return false;
    
    if (withdrawForm.method === 'paypal') {
      return validateEmail(withdrawForm.paypalEmail);
    }
    
    return true;
  };

  const handleSendMoney = async () => {
    if (!user || !sendForm.email || !sendForm.amount) return;

    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.sendMoney(user.user_id, sendForm.email, parseFloat(sendForm.amount), sendForm.description);
      updateUser(updatedUser);
      setSendForm({ email: '', amount: '', description: '' });
      setShowSendModal(false);
      showToast('Money sent successfully!', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to send money', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!user || !topUpForm.amount || !validateTopUpForm()) return;

    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.topUpBalance(parseFloat(topUpForm.amount), topUpForm.method);
      updateUser(updatedUser);
      setTopUpForm({ 
        amount: '', 
        method: 'bank',
        paypalEmail: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        iban: ''
      });
      setShowTopUpModal(false);
      showToast('Balance topped up successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Top-up error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to top up balance', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawForm.amount || !validateWithdrawForm()) return;

    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.withdrawMoney(parseFloat(withdrawForm.amount), withdrawForm.method);
      updateUser(updatedUser);
      setWithdrawForm({ 
        amount: '', 
        method: 'bank',
        paypalEmail: ''
      });
      setShowWithdrawModal(false);
      showToast('Withdrawal successful!', 'success');
      loadData();
    } catch (error) {
      console.error('Withdrawal error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to withdraw money', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!user) return;
    const balance = parseFloat(createCardForm.balance) || 0;
    if (isNaN(balance) || balance <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }
    
    if (balance > (user.balance || 0)) {
      showToast('Insufficient funds to create card with this balance', 'error');
      return;
    }
    
    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.createVirtualCard(user.user_id, user.name, balance);
      updateUser(updatedUser);
      setShowCreateCardModal(false);
      setCreateCardForm({ balance: '' });
      showToast('Virtual card created successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to create card:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create card', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-error" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-success" />;
      case 'topup':
        return <Upload className="w-5 h-5 text-primary" />;
      case 'withdraw':
        return <Download className="w-5 h-5 text-warning" />;
      default:
        return <Wallet className="w-5 h-5 text-secondary" />;
    }
  };

  // Calculate quick stats
  const totalCardBalance = cards.reduce((sum, card) => sum + parseFloat(card.balance ?? '0'), 0);
  const recentTransactionCount = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return transactionDate >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-dark-blue dark:text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-body text-secondary dark:text-gray-300 mt-1">
            Here's your financial overview for today
          </p>
        </div>
      </div>

      {/* Hero Balance Section */}
      <GlassCard className="relative overflow-hidden" opacity="medium">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10 pointer-events-none" />
        
        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Balance Display */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-body-sm text-secondary dark:text-gray-300 font-medium">Total Balance</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl lg:text-5xl font-bold text-dark-blue dark:text-white">
                      {showBalance ? `$${(user?.balance ?? 0).toLocaleString()}` : '••••••'}
                    </h2>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 rounded-xl text-secondary dark:text-gray-300 hover:text-dark-blue dark:hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-body-sm text-secondary dark:text-gray-300">Cards Balance</p>
                    <p className="text-lg font-semibold text-dark-blue dark:text-white">
                      ${totalCardBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-body-sm text-secondary dark:text-gray-300">This Week</p>
                    <p className="text-lg font-semibold text-dark-blue dark:text-white">
                      {transactions.length} transactions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:w-80">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setShowSendModal(true)} 
                  variant="glass" 
                  className="flex-col h-20 gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Send className="w-6 h-6" />
                  <span className="font-medium">Send Money</span>
                </Button>
                <Button 
                  onClick={() => setShowTopUpModal(true)} 
                  variant="glass" 
                  className="flex-col h-20 gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Upload className="w-6 h-6" />
                  <span className="font-medium">Top Up</span>
                </Button>
                <Button 
                  onClick={() => setShowWithdrawModal(true)} 
                  variant="glass" 
                  className="flex-col h-20 gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Download className="w-6 h-6" />
                  <span className="font-medium">Withdraw</span>
                </Button>
                <Button 
                  onClick={() => setShowCreateCardModal(true)} 
                  variant="glass" 
                  className="flex-col h-20 gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-medium">New Card</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Virtual Cards Section */}
        <div className="xl:col-span-2">
          <GlassCard className="p-6 h-full" opacity="medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 font-semibold text-dark-blue dark:text-white">Virtual Cards</h3>
              <span className="text-body-sm text-secondary dark:text-gray-300">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </span>
            </div>
            
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-h4 font-semibold text-dark-blue dark:text-white mb-2">No cards yet</h4>
                <p className="text-body-sm text-secondary dark:text-gray-300 mb-6">
                  Create your first virtual card for secure online payments
                </p>
                <Button onClick={() => setShowCreateCardModal(true)} className="px-6">
                  Create Your First Card
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => (
                  <GlassCard key={card.id} className="p-5 hover:bg-white/5 transition-all duration-200" opacity="low">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-dark-blue dark:text-white">
                            •••• •••• •••• {card.card_number.slice(-4)}
                          </p>
                          <p className="text-body-sm text-secondary dark:text-gray-300">
                            {card.card_holder}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-body-sm font-medium ${
                        card.status === 'active' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {card.status}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-white/10 dark:border-white/5">
                      <p className="text-h4 font-bold text-primary">
                        ${(card.balance ?? 0).toLocaleString()}
                      </p>
                      <p className="text-caption text-secondary dark:text-gray-300">Available Balance</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Transactions Section */}
        <div className="xl:col-span-3">
          <GlassCard className="p-6 h-full" opacity="medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 font-semibold text-dark-blue dark:text-white">Recent Activity</h3>
              <div className="flex items-center gap-2 text-body-sm text-secondary dark:text-gray-300">
                <TrendingUp className="w-4 h-4" />
                <span>{transactions.length} total</span>
              </div>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <h4 className="text-h4 font-semibold text-dark-blue dark:text-white mb-2">No transactions yet</h4>
                <p className="text-body-sm text-secondary dark:text-gray-300">
                  Your transaction history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.slice(0, 10).map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-dark-blue dark:text-white mb-1">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-body-sm text-secondary dark:text-gray-300">
                            {formatDate(transaction.date)}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-caption font-medium ${
                            transaction.status === 'completed' 
                              ? 'bg-success/20 text-success'
                              : transaction.status === 'pending'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-error/20 text-error'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'receive' || transaction.type === 'topup'
                          ? 'text-success'
                          : 'text-error'
                      }`}>
                        {transaction.type === 'receive' || transaction.type === 'topup' ? '+' : '-'}
                        ${(transaction.amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Money"
      >
        <div className="space-y-6">
          <Input
            label="Recipient Email"
            type="email"
            placeholder="Enter email address"
            value={sendForm.email}
            onChange={(value) => setSendForm(prev => ({ ...prev, email: value }))}
            required
          />
          
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={sendForm.amount}
            onChange={(value) => setSendForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <Input
            label="Description (Optional)"
            placeholder="What's this for?"
            value={sendForm.description}
            onChange={(value) => setSendForm(prev => ({ ...prev, description: value }))}
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowSendModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMoney}
              loading={formLoading}
              disabled={!sendForm.email || !sendForm.amount}
            >
              Send Money
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        title="Top Up Balance"
      >
        <div className="space-y-6">
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={topUpForm.amount}
            onChange={(value) => setTopUpForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <div>
            <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
              Payment Method
            </label>
            <select
              value={topUpForm.method}
              onChange={(e) => setTopUpForm(prev => ({ ...prev, method: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-dark-blue dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="bank">Bank Transfer</option>
              <option value="card">Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* PayPal Email Field */}
          {topUpForm.method === 'paypal' && (
            <Input
              label="PayPal Email"
              type="email"
              placeholder="Enter your PayPal email"
              value={topUpForm.paypalEmail}
              onChange={(value) => setTopUpForm(prev => ({ ...prev, paypalEmail: value }))}
              required
              error={topUpForm.paypalEmail && !validateEmail(topUpForm.paypalEmail) ? 'Please enter a valid email address' : ''}
            />
          )}

          {/* Debit Card Fields */}
          {topUpForm.method === 'card' && (
            <div className="space-y-4">
              <Input
                label="Cardholder Name"
                placeholder="Enter name on card"
                value={topUpForm.cardholderName}
                onChange={(value) => setTopUpForm(prev => ({ ...prev, cardholderName: value }))}
                required
              />
              
              <Input
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={topUpForm.cardNumber}
                onChange={(value) => setTopUpForm(prev => ({ ...prev, cardNumber: formatCardNumber(value) }))}
                required
                maxLength={19}
                error={topUpForm.cardNumber && !validateCardNumber(topUpForm.cardNumber) ? 'Please enter a valid 16-digit card number' : ''}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={topUpForm.expiryDate}
                  onChange={(value) => setTopUpForm(prev => ({ ...prev, expiryDate: formatExpiryDate(value) }))}
                  required
                  maxLength={5}
                  error={topUpForm.expiryDate && !validateExpiryDate(topUpForm.expiryDate) ? 'Invalid expiry date' : ''}
                />
                
                <Input
                  label="CVV"
                  placeholder="123"
                  value={topUpForm.cvv}
                  onChange={(value) => setTopUpForm(prev => ({ ...prev, cvv: value.replace(/\D/g, '') }))}
                  required
                  maxLength={4}
                  error={topUpForm.cvv && !validateCVV(topUpForm.cvv) ? 'CVV must be 3-4 digits' : ''}
                />
              </div>
            </div>
          )}

          {/* Bank Transfer - Demo IBAN */}
          {topUpForm.method === 'bank' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-primary">Demo IBAN</h4>
                  <button
                    onClick={() => copyToClipboard(demoIban)}
                    className="flex items-center gap-2 px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
                  >
                    {ibanCopied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-sm text-primary">
                      {ibanCopied ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
                <p className="text-lg font-mono text-dark-blue dark:text-white mb-2">
                  {demoIban}
                </p>
                <p className="text-sm text-secondary dark:text-gray-300">
                  Use this demo IBAN for testing bank transfers
                </p>
              </div>
              
              <Input
                label="Enter IBAN"
                placeholder="GB29 NWBK 6016 1331 9268 19"
                value={topUpForm.iban}
                onChange={(value) => setTopUpForm(prev => ({ ...prev, iban: value.toUpperCase() }))}
                required
                error={topUpForm.iban && !validateIban(topUpForm.iban) ? 'Please enter a valid IBAN' : ''}
              />
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowTopUpModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              loading={formLoading}
              disabled={!validateTopUpForm()}
            >
              Top Up
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Money"
      >
        <div className="space-y-6">
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={withdrawForm.amount}
            onChange={(value) => setWithdrawForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <div>
            <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
              Withdrawal Method
            </label>
            <select
              value={withdrawForm.method}
              onChange={(e) => setWithdrawForm(prev => ({ ...prev, method: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-dark-blue dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="bank">Bank Account</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* PayPal Email Field for Withdrawal */}
          {withdrawForm.method === 'paypal' && (
            <Input
              label="PayPal Email"
              type="email"
              placeholder="Enter your PayPal email"
              value={withdrawForm.paypalEmail}
              onChange={(value) => setWithdrawForm(prev => ({ ...prev, paypalEmail: value }))}
              required
              error={withdrawForm.paypalEmail && !validateEmail(withdrawForm.paypalEmail) ? 'Please enter a valid email address' : ''}
            />
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowWithdrawModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              loading={formLoading}
              disabled={!validateWithdrawForm()}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateCardModal}
        onClose={() => setShowCreateCardModal(false)}
        title="Create Virtual Card"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-h4 font-semibold text-dark-blue dark:text-white mb-2">Create Virtual Card</h4>
            <p className="text-body text-secondary dark:text-gray-300">
              Create a virtual card for secure online payments
            </p>
          </div>
          
          <Input
            label="Starting Balance"
            type="number"
            min="0"
            placeholder="Enter initial balance"
            value={createCardForm.balance}
            onChange={(value) => setCreateCardForm(prev => ({ ...prev, balance: value }))}
            required
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowCreateCardModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCard}
              loading={formLoading}
              disabled={!createCardForm.balance}
            >
              Create Card
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};