import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GlassCard } from '../components/ui/GlassCard';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        showToast('Welcome back to Klyr!', 'success');
        navigate('/personal');
      } else {
        showToast('Invalid email or password', 'error');
      }
    } catch (error) {
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-gradient/10 to-primary/30 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg flex items-center justify-center px-4">
      <ToastContainer />
      <div className="w-full max-w-md animate-fade-in">
        <GlassCard className="p-8" opacity="high">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Cloud className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-h1 font-bold text-dark-blue dark:text-white">Welcome back</h1>
            <p className="text-body text-secondary dark:text-gray-300 mt-2">Sign in to your Klyr account</p>
          </div>

          {/* Demo Info */}
          <GlassCard className="p-4 mb-6" opacity="low">
            <p className="text-body-sm text-primary font-medium mb-2">Demo Credentials:</p>
            <p className="text-caption text-secondary dark:text-gray-300">Email: john@example.com</p>
            <p className="text-caption text-secondary dark:text-gray-300">Password: password</p>
          </GlassCard>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-11 text-placeholder hover:text-dark-blue dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-body-sm text-secondary dark:text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-medium hover:text-gradient transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};