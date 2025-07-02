import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Target, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { groupService } from '../services/groupService';
import { Group } from '../types';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, colorClass }) => (
  <div className={`bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${colorClass}`}>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white/50 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-body-sm text-white/80">{label}</p>
        <p className="text-h2 font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      const userGroups = await groupService.getUserGroups(user.user_id);
      setGroups(userGroups);
    } catch (error) {
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    setCreateLoading(true);
    try {
      await groupService.createGroup(newGroupName, '', user.user_id);
      setNewGroupName('');
      setShowCreateModal(false);
      showToast('Group created successfully!', 'success');
      loadGroups();
    } catch (error) {
      showToast('Failed to create group', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const calculateGroupStats = (group: Group) => {
    const goals = group.goals || [];
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalContributions = goals.reduce((sum, goal) => 
      sum + (goal.contributions || []).reduce((contribSum, contrib) => contribSum + contrib.amount, 0), 0
    );
    const totalExpenses = goals.reduce((sum, goal) => 
      sum + (goal.expenses || []).reduce((expenseSum, expense) => expenseSum + expense.amount, 0), 0
    );
    
    return {
      totalTarget,
      totalContributions,
      totalExpenses,
      netAmount: totalContributions - totalExpenses,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalSaved = groups.reduce((sum, group) => sum + calculateGroupStats(group).netAmount, 0);
  const totalGoals = groups.reduce((sum, group) => sum + group.goals.length, 0);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ToastContainer />
        
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-500 mt-1">
              Here's your financial dashboard overview.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 shadow-sm">
            <Plus className="w-5 h-5" />
            Create Group
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Users className="w-6 h-6 text-white" />} label="Total Groups" value={groups.length} colorClass="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard icon={<Target className="w-6 h-6 text-white" />} label="Active Goals" value={totalGoals} colorClass="bg-gradient-to-br from-green-500 to-green-600" />
          <StatCard icon={<DollarSign className="w-6 h-6 text-white" />} label="Total Saved" value={`$${totalSaved.toLocaleString()}`} colorClass="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard icon={<TrendingUp className="w-6 h-6 text-white" />} label="Avg. Progress" value={`${groups.length > 0 ? Math.round(groups.reduce((sum, group) => sum + (calculateGroupStats(group).totalTarget > 0 ? (calculateGroupStats(group).netAmount / calculateGroupStats(group).totalTarget) * 100 : 0), 0) / groups.length) : 0}%`} colorClass="bg-gradient-to-br from-orange-500 to-orange-600" />
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Groups</h2>
          {groups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No groups yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Create a group to start saving for shared goals with friends and family.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Group
                </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const stats = calculateGroupStats(group);
                const progress = stats.totalTarget > 0 ? (stats.netAmount / stats.totalTarget) * 100 : 0;
                return (
                  <Link key={group.group_id} to={`/groups/${group.group_id}`} className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{group.members.length} members</p>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden">
                          {group.members.slice(0, 3).map((member) => (
                            <img key={member.user_id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={`https://i.pravatar.cc/40?u=${member.user.email}`} alt={member.user.name} />
                          ))}
                          {group.members.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white">
                              <span className="text-xs font-medium text-gray-500">+{group.members.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-medium text-gray-600">Progress</span>
                            <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                          </div>
                          <ProgressBar value={progress} className="h-2 bg-gray-200 rounded-full" />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-500">Saved: <span className="font-semibold text-gray-700">${stats.netAmount.toLocaleString()}</span></p>
                            <p className="text-gray-500">Target: <span className="font-semibold text-gray-700">${stats.totalTarget.toLocaleString()}</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Details <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create a New Group">
          <div className="space-y-4">
            <p className="text-gray-600">Groups help you organize your shared savings goals and expenses.</p>
            <Input value={newGroupName} onChange={setNewGroupName} placeholder="E.g., Vacation Fund, Apartment Expenses" label="Group Name" />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup} disabled={createLoading}>
                {createLoading ? <LoadingSpinner size="sm" /> : 'Create Group'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};