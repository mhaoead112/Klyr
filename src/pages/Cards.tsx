import React, { useEffect, useState } from 'react';
import { Plus, CreditCard, Eye, EyeOff, Trees as Freeze, Copy, MoreVertical, Wallet, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bankingService } from '../services/bankingService';
import { VirtualCard } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Cards: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<{ [key: string]: boolean }>({});
  const [formLoading, setFormLoading] = useState(false);
  const [newCardBalance, setNewCardBalance] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [cardToTopUp, setCardToTopUp] = useState<VirtualCard | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cardsData = await bankingService.getUserCards(user.user_id);
      setCards(cardsData);
    } catch (error) {
      showToast('Failed to load cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    if (!user) return;

    const balance = parseFloat(newCardBalance);
    if (isNaN(balance) || balance <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }
    
    if (balance > user.balance) {
      showToast('Initial balance cannot exceed your main account balance.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.createVirtualCard(user.user_id, user.name, balance);
      updateUser(updatedUser);
      setShowCreateModal(false);
      setNewCardBalance('');
      showToast('Virtual card created successfully!', 'success');
      loadCards();
    } catch (error) {
      const err = error as Error;
      showToast(err.message || 'Failed to create card', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (cardId: string) => {
    setCardToDelete(cardId);
    setShowDeleteModal(true);
  };

  const handleDeleteCard = async () => {
    if (!user || !cardToDelete) return;

    setFormLoading(true);
    try {
      const { user: updatedUser } = await bankingService.deleteVirtualCard(cardToDelete, user.user_id);
      updateUser(updatedUser);
      showToast('Card deleted successfully!', 'success');
      loadCards();
    } catch (error) {
      const err = error as Error;
      showToast(err.message || 'Failed to delete card', 'error');
    } finally {
      setFormLoading(false);
      setShowDeleteModal(false);
      setCardToDelete(null);
    }
  };

  const openTopUpModal = (card: VirtualCard) => {
    setCardToTopUp(card);
    setShowTopUpModal(true);
    setTopUpAmount('');
  };

  const handleTopUpCard = async () => {
    if (!user || !cardToTopUp || !topUpAmount) return;

    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }

    if (amount > user.balance) {
      showToast('Top-up amount cannot exceed your main account balance.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const { user: updatedUser, card: updatedCard } = await bankingService.topUpVirtualCard(cardToTopUp.id, user.user_id, amount);
      updateUser(updatedUser);
      setCards(prevCards => prevCards.map(c => c.id === updatedCard.id ? updatedCard : c));
      showToast('Top-up successful!', 'success');
      setShowTopUpModal(false);
    } catch (error) {
      const err = error as Error;
      showToast(err.message || 'Failed to top up card', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleCardDetails = (cardId: string) => {
    setShowCardDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const formatCardNumber = (number: string, showFull: boolean = false) => {
    if (showFull) {
      return number;
    }
    return `•••• •••• •••• ${number.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-dark-blue dark:text-white">
            Virtual Cards
          </h1>
          <p className="text-body text-secondary dark:text-gray-300 mt-1">
            Manage your virtual cards for secure online payments
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Create Card
        </Button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <GlassCard className="p-12 text-center" opacity="medium">
          <div className="w-20 h-20 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-placeholder" />
          </div>
          <h3 className="text-h2 font-semibold text-dark-blue dark:text-white mb-2">No cards yet</h3>
          <p className="text-body text-secondary dark:text-gray-300 mb-8 max-w-md mx-auto">
            Create your first virtual card to start making secure online payments
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Card
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => (
            <GlassCard key={card.id} className="p-0 overflow-hidden" opacity="medium">
              {/* Card Visual */}
              <div className="relative h-48 bg-gradient-to-br from-primary via-gradient to-primary-dark p-6 text-white">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">K</span>
                    </div>
                    <span className="font-semibold">Klyr</span>
                  </div>
                  <button
                    onClick={() => toggleCardDetails(card.id)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {showCardDetails[card.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-white/80 text-caption mb-1">Card Number</p>
                    <p className="font-mono text-body-lg tracking-wider">
                      {formatCardNumber(card.card_number, showCardDetails[card.id])}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-white/80 text-caption mb-1">Card Holder</p>
                      <p className="font-medium">{card.card_holder_name}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-caption mb-1">Expires</p>
                      <p className="font-medium">{card.expiry_date}</p>
                    </div>
                    {showCardDetails[card.id] && (
                      <div>
                        <p className="text-white/80 text-caption mb-1">CVV</p>
                        <p className="font-medium">{card.cvv}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Card Details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-body-sm text-secondary dark:text-gray-300">Balance</p>
                    <p className="text-h3 font-bold text-dark-blue dark:text-white">
                      ${card.balance.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-body-sm font-medium ${
                    card.status === 'active' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {card.status}
                  </span>
                </div>
                
                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-3">
                                    <Button
                    variant="glass"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => openTopUpModal(card)}
                  >
                    <Wallet className="w-4 h-4" />
                    Top Up
                  </Button>
                                    <Button
                    variant="glass"
                    size="sm"
                    className="flex items-center gap-2 text-danger"
                    onClick={() => openDeleteModal(card.id)}
                  >
                    <Shield className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <GlassCard className="p-6 text-center" opacity="medium">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">Secure Payments</h3>
          <p className="text-body-sm text-secondary dark:text-gray-300">
            Your virtual cards are protected with advanced security features
          </p>
        </GlassCard>
        
        <GlassCard className="p-6 text-center" opacity="medium">
          <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">Instant Creation</h3>
          <p className="text-body-sm text-secondary dark:text-gray-300">
            Create virtual cards instantly for immediate use online
          </p>
        </GlassCard>
        
        <GlassCard className="p-6 text-center" opacity="medium">
          <div className="w-12 h-12 bg-gradient/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-6 h-6 text-gradient" />
          </div>
          <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">Easy Management</h3>
          <p className="text-body-sm text-secondary dark:text-gray-300">
            Freeze, unfreeze, and manage your cards with a single tap
          </p>
        </GlassCard>
      </div>

      {/* Create Card Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Virtual Card"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">
              Create Virtual Card
            </h3>
            <p className="text-body text-secondary dark:text-gray-300">
              Your new virtual card will be created instantly and ready for online payments
            </p>
          </div>
          
          <GlassCard className="p-4" opacity="low">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-body-sm font-medium text-dark-blue dark:text-white">Secure & Private</p>
                <p className="text-caption text-secondary dark:text-gray-300">Your card details are encrypted and secure</p>
              </div>
            </div>
          </GlassCard>
          
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="balance" className="block text-body-sm font-medium text-secondary dark:text-gray-300 mb-2">
                Initial Balance
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary dark:text-gray-400">$</span>
                <input
                  type="number"
                  id="balance"
                  value={newCardBalance}
                  onChange={(e) => setNewCardBalance(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-transparent focus:border-primary focus:ring-primary transition"
                  placeholder="50.00"
                />
              </div>
              <p className="text-caption text-secondary dark:text-gray-400 mt-2">
                Your main balance: ${user?.balance.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCard} disabled={formLoading}>
                {formLoading ? <LoadingSpinner /> : 'Create Card'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Card Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <div>
          <p className="text-secondary dark:text-gray-300">
            Are you sure you want to delete this card? The remaining balance will be refunded to your main account. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCard} disabled={formLoading}>
              {formLoading ? <LoadingSpinner size="sm" /> : 'Delete Card'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        title={`Top Up Card`}
        size="sm"
      >
        <div>
          <p className="text-secondary dark:text-gray-300 mb-4">
            Topping up card ending in <span className="font-semibold text-dark-blue dark:text-white">{cardToTopUp?.card_number.slice(-4)}</span>.
          </p>
          <div>
            <label htmlFor="topup-amount" className="block text-body-sm font-medium text-secondary dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary dark:text-gray-400">$</span>
              <input
                type="number"
                id="topup-amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full pl-7 pr-4 py-2 rounded-lg bg-white/50 dark:bg-white/10 border border-transparent focus:border-primary focus:ring-primary transition"
                placeholder="20.00"
              />
            </div>
            <p className="text-caption text-secondary dark:text-gray-400 mt-2">
              Your main balance: ${user?.balance.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={() => setShowTopUpModal(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={handleTopUpCard} disabled={formLoading}>
              {formLoading ? <LoadingSpinner size="sm" /> : 'Confirm Top Up'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};