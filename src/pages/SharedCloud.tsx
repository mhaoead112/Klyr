import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign,
  Receipt,
  Share2,
  PiggyBank
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { Group, Bill } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export const SharedCloud: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  
  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [billForm, setBillForm] = useState({ title: '', amount: '', groupId: '' });
  const [formLoading, setFormLoading] = useState(false);
  
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [groupsData, billsData] = await Promise.all([
        groupService.getUserGroups(user.user_id),
        groupService.getUserBills(user.user_id),
      ]);
      setGroups(groupsData);
      setBills(billsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !user) return;

    setFormLoading(true);
    try {
      await groupService.createGroup(groupForm.name, groupForm.description, user.user_id);
      setGroupForm({ name: '', description: '' });
      setShowCreateGroupModal(false);
      showToast('Group created successfully!', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to create group', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSplitBill = async () => {
    if (!billForm.title || !billForm.amount || !billForm.groupId || !user) return;
  
    setFormLoading(true);
    try {
      const group = groups.find(g => g.group_id === billForm.groupId);
      if (!group) return;
  
      const participantIds = (group.members || []).map(m => m.user_id);
      if (participantIds.length === 0) {
        showToast('Successfully sent a request to split the bill.', 'success');
        setFormLoading(false);
        return;
      }
  
      await groupService.createBill(
        billForm.title,
        parseFloat(billForm.amount),
        user.user_id,
        billForm.groupId,
        participantIds
      );
  
      setBillForm({ title: '', amount: '', groupId: '' });
      setShowSplitBillModal(false);
      showToast('Bill split successfully!', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to split bill', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePayBill = async (billId: string) => {
    if (!user) return;

    try {
      await groupService.payBill(billId, user.user_id);
      showToast('Bill paid successfully!', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to pay bill', 'error');
    }
  };

  const calculateGroupStats = (group: Group) => {
    const goals = group.goals || [];
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    
    return {
      totalTarget,
      totalCurrent,
      progress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
            Shared Cloud
          </h1>
          <p className="text-body text-secondary dark:text-gray-300 mt-1">
            Collaborate on savings goals and split expenses with your groups
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreateGroupModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Group
          </Button>
          <Button onClick={() => setShowSplitBillModal(true)} variant="secondary">
            <Share2 className="w-5 h-5 mr-2" />
            Split Bill
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6" opacity="medium">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-body-sm text-secondary dark:text-gray-300">Total Groups</p>
              <p className="text-h2 font-bold text-dark-blue dark:text-white">{groups.length}</p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6" opacity="medium">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-body-sm text-secondary dark:text-gray-300">Active Goals</p>
              <p className="text-h2 font-bold text-dark-blue dark:text-white">
                {groups.reduce((sum, group) => sum + (group.goals?.length || 0), 0)}
              </p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6" opacity="medium">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient/20 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-gradient" />
            </div>
            <div>
              <p className="text-body-sm text-secondary dark:text-gray-300">Total Saved</p>
              <p className="text-h2 font-bold text-dark-blue dark:text-white">
                ${groups.reduce((sum, group) => sum + (group.total_balance || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6" opacity="medium">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-body-sm text-secondary dark:text-gray-300">Pending Bills</p>
              <p className="text-h2 font-bold text-dark-blue dark:text-white">
                {bills.filter(bill => bill.participants.some(p => p.user_id === user?.id && p.status === 'pending')).length}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6" opacity="medium">
            <h2 className="text-h2 font-semibold text-dark-blue dark:text-white mb-6">Your Groups</h2>
            
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-placeholder" />
                </div>
                <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">No groups yet</h3>
                <p className="text-body text-secondary dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Create your first group to start saving together with friends and family
                </p>
                <Button onClick={() => setShowCreateGroupModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => {
                  const stats = calculateGroupStats(group);
                  
                  return (
                    <Link
                      key={group.group_id}
                      to={`/groups/${group.group_id}`}
                      className="block"
                    >
                      <GlassCard className="p-6 hover:bg-white/15 dark:hover:bg-white/15 transition-all duration-200 group" opacity="low">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white group-hover:text-primary transition-colors">
                              {group.name}
                            </h3>
                            <p className="text-body-sm text-secondary dark:text-gray-300 mt-1">
                              {group.members?.length !== 1 ? '' : ''}
                            </p>
                            {group.description && (
                              <p className="text-body-sm text-secondary dark:text-gray-300 mt-1">
                                {group.description}
                              </p>
                            )}
                          </div>
                          <div className="flex -space-x-2">
                            {(group.members || []).slice(0, 3).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 bg-gradient-to-r from-primary to-gradient rounded-full flex items-center justify-center border-2 border-white dark:border-dark-surface"
                              >
                                <span className="text-white font-semibold text-xs">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {(group.members || []).length > 3 && (
                              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center border-2 border-white dark:border-dark-surface">
                                <span className="text-dark-blue dark:text-white font-semibold text-xs">
                                  +{group.members.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {(group.goals || []).length > 0 ? (
                          <div className="space-y-4">
                            <ProgressBar value={stats.progress} />
                            
                            <div className="flex items-center justify-between text-body-sm">
                              <span className="text-secondary dark:text-gray-300">
                                {group.goals.length} goal{group.goals.length !== 1 ? 's' : ''}
                              </span>
                              <span className="text-primary font-medium">
                                ${(group.total_balance || 0).toLocaleString()} saved
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <Target className="w-8 h-8 text-placeholder mx-auto mb-2" />
                            <p className="text-body-sm text-secondary dark:text-gray-300">No goals set yet</p>
                          </div>
                        )}
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Bills & Expenses */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6" opacity="medium">
            <h3 className="text-h3 font-semibold text-dark-blue dark:text-white mb-4">Recent Bills</h3>
            
            {bills.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-placeholder mx-auto mb-3" />
                {/* <p className="text-body-sm text-secondary dark:text-gray-300 mb-4">No bills yet</p> */}
                <Button onClick={() => setShowSplitBillModal(true)} size="sm">
                  Split a Bill
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.slice(0, 5).map((bill) => {
                  const userParticipant = bill.participants.find(p => p.user_id === user?.id);
                  
                  return (
                    <GlassCard key={bill.id} className="p-4" opacity="low">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-dark-blue dark:text-white">{bill.title}</p>
                          <p className="text-caption text-secondary dark:text-gray-300">
                            {formatDate(bill.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-caption font-medium ${
                          userParticipant?.status === 'paid'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}>
                          {userParticipant?.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-body font-semibold text-primary">
                          ${userParticipant?.amount_owed.toLocaleString()}
                        </span>
                        {userParticipant?.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handlePayBill(bill.id)}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create New Group"
      >
        <div className="space-y-6">
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={groupForm.name}
            onChange={(value) => setGroupForm(prev => ({ ...prev, name: value }))}
            required
          />
          
          <Input
            label="Description (Optional)"
            placeholder="What's this group for?"
            value={groupForm.description}
            onChange={(value) => setGroupForm(prev => ({ ...prev, description: value }))}
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowCreateGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              loading={formLoading}
              disabled={!groupForm.name.trim()}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        title="Split a Bill"
      >
        <div className="space-y-6">
          <Input
            label="Bill Title"
            placeholder="What's this bill for?"
            value={billForm.title}
            onChange={(value) => setBillForm(prev => ({ ...prev, title: value }))}
            required
          />
          
          <Input
            label="Total Amount"
            type="number"
            placeholder="0.00"
            value={billForm.amount}
            onChange={(value) => setBillForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <div>
            <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
              Select Group
            </label>
            <select
              value={billForm.groupId}
              onChange={(e) => setBillForm(prev => ({ ...prev, groupId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-dark-blue dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowSplitBillModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSplitBill}
              loading={formLoading}
              disabled={!billForm.title || !billForm.amount || !billForm.groupId}
            >
              Split Bill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};