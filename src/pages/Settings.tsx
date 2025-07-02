import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Moon, Sun, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { updateProfile, changePassword } from '../services/authService';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updatedUser = await updateProfile(user.user_id, { name, email });
      updateUser(updatedUser); // Update the user context with the updated user data
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password', error);
      alert('Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1 font-bold text-dark-blue dark:text-white">Settings</h1>
        <p className="text-body text-secondary dark:text-gray-300 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <GlassCard className="p-6" opacity="medium">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Profile</h2>
            <p className="text-body-sm text-secondary dark:text-gray-300">Update your personal information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  
                  className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-secondary dark:text-gray-300 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-secondary dark:text-gray-300 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              {isEditingProfile ? (
                <>
                  <Button type="submit" variant="secondary">Save Changes</Button>
                  <Button variant="glass" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </div>
      </GlassCard>

      {/* Appearance Section */}
      <GlassCard className="p-6" opacity="medium">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient/20 rounded-xl flex items-center justify-center">
            <Palette className="w-6 h-6 text-gradient" />
          </div>
          <div>
            <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Appearance</h2>
            <p className="text-body-sm text-secondary dark:text-gray-300">Customize how Klyr looks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-dark-blue dark:text-white">Dark Mode</p>
              <p className="text-body-sm text-secondary dark:text-gray-300">Switch between light and dark themes</p>
            </div>
            <Button
              onClick={toggleTheme}
              variant="glass"
              className="flex items-center gap-2"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? 'Light' : 'Dark'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Notifications Section */}
      <GlassCard className="p-6" opacity="medium">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Notifications</h2>
            <p className="text-body-sm text-secondary dark:text-gray-300">Control how you receive notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-dark-blue dark:text-white">Goal Updates</p>
              <p className="text-body-sm text-secondary dark:text-gray-300">Get notified when goals are updated</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50" 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-dark-blue dark:text-white">New Contributions</p>
              <p className="text-body-sm text-secondary dark:text-gray-300">Notifications for new contributions</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50" 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-dark-blue dark:text-white">Group Invites</p>
              <p className="text-body-sm text-secondary dark:text-gray-300">Get notified when you're invited to groups</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50" 
            />
          </div>
        </div>
      </GlassCard>

      {/* Security Section */}
      <GlassCard className="p-6" opacity="medium">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-success" />
          </div>
          <div>
            <h2 className="text-h2 font-semibold text-dark-blue dark:text-white">Security</h2>
            <p className="text-body-sm text-secondary dark:text-gray-300">Manage your account security</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-secondary dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-secondary dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-dark-blue dark:text-white mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-secondary dark:text-gray-300"
              />
            </div>
            <Button type="submit" variant="secondary">Change Password</Button>
          </form>

          <div className="mt-6">
            <Button variant="secondary" disabled>
              Two-Factor Authentication (Coming Soon)
            </Button>
          </div>
      </GlassCard>
    </div>
  );
};