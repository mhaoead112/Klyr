import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  User,
  Settings,
  TrendingUp,
  Scissors
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { Group, Goal } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'expenses' | 'members'>('overview');
  
  // Modal states
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showAddContributionModal, setShowAddContributionModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  
  // Form states
  const [goalForm, setGoalForm] = useState({ title: '', amount: '', deadline: '' });
  const [contributionForm, setContributionForm] = useState({ goalId: '', amount: '', note: '' });
  const [expenseForm, setExpenseForm] = useState({ goalId: '', amount: '', note: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [billForm, setBillForm] = useState({ amount: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = async () => {
    if (!groupId) return;
    
    try {
      const groupData = await groupService.getGroup(groupId);
      setGroup(groupData);
    } catch (error) {
      showToast('Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!group || !user || !goalForm.title || !goalForm.amount || !goalForm.deadline) return;

    setFormLoading(true);
    try {
      await groupService.createGoal(
        group.group_id,
        goalForm.title,
        parseFloat(goalForm.amount),
        goalForm.deadline,
        user.user_id
      );
      setGoalForm({ title: '', amount: '', deadline: '' });
      setShowCreateGoalModal(false);
      showToast('Goal created successfully!', 'success');
      loadGroup();
    } catch (error) {
      showToast('Failed to create goal', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (!user || !contributionForm.goalId || !contributionForm.amount) return;

    setFormLoading(true);
    try {
      await groupService.addContribution(
        contributionForm.goalId,
        user.user_id,
        parseFloat(contributionForm.amount),
        contributionForm.note
      );
      setContributionForm({ goalId: '', amount: '', note: '' });
      setShowAddContributionModal(false);
      showToast('Contribution added successfully!', 'success');
      loadGroup();
    } catch (error) {
      showToast('Failed to add contribution', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!user || !expenseForm.goalId || !expenseForm.amount || !expenseForm.note) return;

    setFormLoading(true);
    try {
      await groupService.addExpense(
        expenseForm.goalId,
        user.user_id,
        parseFloat(expenseForm.amount),
        expenseForm.note
      );
      setExpenseForm({ goalId: '', amount: '', note: '' });
      setShowAddExpenseModal(false);
      showToast('Expense added successfully!', 'success');
      loadGroup();
    } catch (error) {
      showToast('Failed to add expense', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!group || !inviteEmail) return;

    setFormLoading(true);
    try {
      const success = await groupService.inviteToGroup(group.group_id, inviteEmail);
      if (success) {
        setInviteEmail('');
        setShowInviteModal(false);
        showToast('Member invited successfully!', 'success');
        loadGroup();
      } else {
        showToast('Failed to invite member. User may not exist or already be a member.', 'error');
      }
    } catch (error) {
      showToast('Failed to invite member', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSplitBill = async () => {
    if (!billForm.amount || !billForm.description) return;

    setFormLoading(true);
    
    // Mock API call to simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setFormLoading(false);
    setShowSplitBillModal(false);
    setBillForm({ amount: '', description: '' });
    showToast('Bill split request sent successfully!', 'success');
  };

  const calculateGoalStats = (goal: Goal) => {
    return {
      progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
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

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto">
        <GlassCard className="p-12 text-center" opacity="medium">
          <h2 className="text-h2 font-semibold text-dark-blue dark:text-white mb-2">Group not found</h2>
          <p className="text-body text-secondary dark:text-gray-300 mb-6">The group you're looking for doesn't exist.</p>
          <Link to="/shared">
            <Button>Back to Shared Cloud</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const isAdmin = group.members?.find(m => m.user_id === user?.user_id)?.role === 'admin';
  const allContributions = group.goals?.flatMap(goal => goal.contributions) || [];
  const allExpenses = group.goals?.flatMap(goal => goal.expenses) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <ToastContainer />
      
      {/* Header */}
      <GlassCard className="p-6" opacity="medium">
        <div className="flex items-center gap-4">
          <Link to="/shared">
            <Button variant="glass" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-h1 font-bold text-dark-blue dark:text-white">{group.name}</h1>
            <p className="text-body text-secondary dark:text-gray-300">
              {group.members?.length ?? 0} member{group.members?.length !== 1 ? 's' : ''} • 
              Created {formatDate(group.created_at)}
            </p>
            {group.description && (
              <p className="text-body text-secondary dark:text-gray-300 mt-1">{group.description}</p>
            )}
          </div>
          {isAdmin && (
            <Button variant="glass">
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Tabs */}
      <GlassCard className="p-0" opacity="medium">
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              // { id: 'contributions', label: 'Contributions', icon: TrendingUp },
              // { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'members', label: 'Members', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-body-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary dark:text-gray-300 hover:text-dark-blue dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setShowCreateGoalModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Goal
                </Button>
                {group.goals?.length > 0 && (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={() => setShowAddContributionModal(true)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Contribution
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => setShowAddExpenseModal(true)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Expense
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button variant="glass" onClick={() => setShowInviteModal(true)}>
                    <Users className="w-5 h-5 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>

              {/* Goals */}
              {group.goals?.length === 0 ? (
                <GlassCard className="p-12 text-center" opacity="low">
                  <div className="w-16 h-16 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-placeholder" />
                  </div>
                  <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">No goals yet</h3>
                  <p className="text-body text-secondary dark:text-gray-300 mb-6 max-w-md mx-auto">
                    Create your first savings goal to start tracking contributions and expenses
                  </p>
                  <Button onClick={() => setShowCreateGoalModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Goal
                  </Button>
                </GlassCard>
              ) : (
                <div className="space-y-6">
                  {group.goals?.map((goal) => {
                    const stats = calculateGoalStats(goal);
                    const isOverdue = new Date(goal.deadline) < new Date();
                    
                    return (
                      <GlassCard key={goal.goal_id} className="p-6" opacity="low">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white">{goal.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-body-sm text-secondary dark:text-gray-300">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Due {formatDate(goal.deadline)}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-error font-medium">Overdue</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-h2 font-bold text-primary">
                                ${goal.target_amount.toLocaleString()}
                              </span>
                            </div>
                            
                            <ProgressBar
                              value={goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0}
                              className="mb-4"
                            />
                            
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-body-sm text-secondary dark:text-gray-300">Current Amount</p>
                                <p className="text-body font-semibold text-success">
                                  ${goal.current_amount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-body-sm text-secondary dark:text-gray-300">Remaining</p>
                                <p className="text-body font-semibold text-secondary dark:text-gray-300">
                                  ${(goal.target_amount - goal.current_amount).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm text-secondary dark:text-gray-300">Progress</p>
                                  <p className="text-sm font-semibold text-primary">{stats.progress.toFixed(1)}%</p>
                                </div>
                                <ProgressBar value={stats.progress} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contributions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Recent Contributions</h2>
                {group.goals?.length > 0 && (
                  <Button onClick={() => setShowAddContributionModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Contribution
                  </Button>
                )}
              </div>
              
              {allContributions?.length === 0 ? (
                <GlassCard className="p-12 text-center" opacity="low">
                  <TrendingUp className="w-16 h-16 text-placeholder mx-auto mb-4" />
                  <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">No contributions yet</h3>
                  <p className="text-body text-secondary dark:text-gray-300">Start contributing to your group goals</p>
                </GlassCard>
              ) : (
                <GlassCard className="overflow-hidden" opacity="low">
                  <div className="divide-y divide-white/10">
                    {allContributions
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((contribution) => (
                        <div key={contribution.contribution_id} className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-dark-blue dark:text-white">
                                {contribution.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-body-sm text-secondary dark:text-gray-300">
                                {formatDate(contribution.created_at)}
                              </p>
                              {contribution.note && (
                                <p className="text-body-sm text-secondary dark:text-gray-300 mt-1">{contribution.note}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-body-lg font-semibold text-success">
                            +${contribution.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Recent Expenses</h2>
                {group.goals?.length > 0 && (
                  <>
                    <Button variant="secondary" onClick={() => setShowAddExpenseModal(true)}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                    <Button variant="secondary" onClick={() => setShowSplitBillModal(true)}>
                      <Scissors className="w-4 h-4 mr-2" />
                      Split Bill
                    </Button>
                  </>
                )}
              </div>
              
              {allExpenses.length === 0 ? (
                <GlassCard className="p-12 text-center" opacity="low">
                  <DollarSign className="w-16 h-16 text-placeholder mx-auto mb-4" />
                  <h3 className="text-body-lg font-semibold text-dark-blue dark:text-white mb-2">No expenses yet</h3>
                  <p className="text-body text-secondary dark:text-gray-300">Track shared expenses for your group</p>
                </GlassCard>
              ) : (
                <GlassCard className="overflow-hidden" opacity="low">
                  <div className="divide-y divide-white/10">
                    {allExpenses
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((expense) => (
                        <div key={expense.expense_id} className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-error" />
                            </div>
                            <div>
                              <p className="font-medium text-dark-blue dark:text-white">
                                {expense.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-body-sm text-secondary dark:text-gray-300">
                                {formatDate(expense.created_at)}
                              </p>
                              <p className="text-body-sm text-secondary dark:text-gray-300 mt-1">{expense.note}</p>
                            </div>
                          </div>
                          <span className="text-body-lg font-semibold text-error">
                            -${expense.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Group Members</h2>
                {isAdmin && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
              
              <GlassCard className="overflow-hidden" opacity="low">
                <div className="divide-y divide-white/10">
                  {group.members.map((member) => (
                    <div key={member.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-gradient rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-blue dark:text-white">
                            {member.user?.name || 'User'}
                          </p>
                          <p className="text-body-sm text-secondary dark:text-gray-300">
                            {member.user?.email || 'Email Redacted for privacy'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-body-sm font-medium ${
                          member.role === 'admin' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-secondary/20 text-secondary dark:text-gray-300'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Modals */}
      <Modal
        isOpen={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        title="Create New Goal"
      >
        <div className="space-y-6">
          <Input
            label="Goal Title"
            placeholder="Enter goal title"
            value={goalForm.title}
            onChange={(value) => setGoalForm(prev => ({ ...prev, title: value }))}
            required
          />
          
          <Input
            label="Target Amount"
            type="number"
            placeholder="0.00"
            value={goalForm.amount}
            onChange={(value) => setGoalForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <Input
            label="Deadline"
            type="date"
            value={goalForm.deadline}
            onChange={(value) => setGoalForm(prev => ({ ...prev, deadline: value }))}
            required
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowCreateGoalModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGoal}
              loading={formLoading}
              disabled={!goalForm.title || !goalForm.amount || !goalForm.deadline}
            >
              Create Goal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddContributionModal}
        onClose={() => setShowAddContributionModal(false)}
        title="Add Contribution"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
              Select Goal
            </label>
            <select
              value={contributionForm.goalId}
              onChange={(e) => setContributionForm(prev => ({ ...prev, goalId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-dark-blue dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a goal</option>
              {group.goals.map((goal) => (
                <option key={goal.goal_id} value={goal.goal_id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={contributionForm.amount}
            onChange={(value) => setContributionForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <Input
            label="Note (Optional)"
            placeholder="Add a note"
            value={contributionForm.note}
            onChange={(value) => setContributionForm(prev => ({ ...prev, note: value }))}
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowAddContributionModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContribution}
              loading={formLoading}
              disabled={!contributionForm.goalId || !contributionForm.amount}
            >
              Add Contribution
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        title="Add Expense"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
              Select Goal
            </label>
            <select
              value={expenseForm.goalId}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, goalId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-dark-blue dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a goal</option>
              {group.goals.map((goal) => (
                <option key={goal.goal_id} value={goal.goal_id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={expenseForm.amount}
            onChange={(value) => setExpenseForm(prev => ({ ...prev, amount: value }))}
            required
          />
          
          <Input
            label="Description"
            placeholder="What was this expense for?"
            value={expenseForm.note}
            onChange={(value) => setExpenseForm(prev => ({ ...prev, note: value }))}
            required
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowAddExpenseModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              loading={formLoading}
              disabled={!expenseForm.goalId || !expenseForm.amount || !expenseForm.note}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={setInviteEmail}
            required
          />
          
          <GlassCard className="p-4" opacity="low">
            <p className="text-body-sm text-primary font-medium mb-2">Available demo emails:</p>
            <p className="text-caption text-secondary dark:text-gray-300">alice@example.com</p>
          </GlassCard>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              loading={formLoading}
              disabled={!inviteEmail}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Split Bill Modal */}
      <Modal
        title="Split a Bill"
        isOpen={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
      >
        <div className="space-y-4">
          <Input
            label="Total Bill Amount"
            type="number"
            placeholder="0.00"
            value={billForm.amount}
            onChange={(val) => setBillForm({ ...billForm, amount: val })}
            required
          />
          <Input
            label="Description"
            placeholder="e.g., Dinner at restaurant"
            value={billForm.description}
            onChange={(val) => setBillForm({ ...billForm, description: val })}
            required
          />
          <p className="text-body-sm text-secondary dark:text-gray-300">
            This is a mock feature. Clicking 'Split' will simulate a successful request.
          </p>
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
              disabled={!billForm.amount || !billForm.description}
            >
              Split Bill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};