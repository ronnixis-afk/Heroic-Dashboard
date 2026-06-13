import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { fetchRpgAdmin } from '../../lib/rpgAdminApi';
import { cn } from '../../lib/utils';
import { Settings, ShieldAlert, CheckCircle2, AlertCircle, Users, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui';

interface SettingsData {
  maxFreeUsers: number | null;
  currentFreeUsers: number;
  referralSignupReward: number;
  referralPremiumReward: number;
}

export default function AdminSettings() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  
  const [settings, setSettings] = useState<SettingsData>({
    maxFreeUsers: null,
    currentFreeUsers: 0,
    referralSignupReward: 200,
    referralPremiumReward: 1000
  });

  const [enableLimit, setEnableLimit] = useState(false);
  const [limitValue, setLimitValue] = useState<number>(100);
  const [signupReward, setSignupReward] = useState<number>(200);
  const [premiumReward, setPremiumReward] = useState<number>(1000);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchRpgAdmin<SettingsData>('/api/admin/settings', getToken);
        setSettings(data);
        if (data.maxFreeUsers !== null) {
          setEnableLimit(true);
          setLimitValue(data.maxFreeUsers);
        } else {
          setEnableLimit(false);
        }
        setSignupReward(data.referralSignupReward);
        setPremiumReward(data.referralPremiumReward);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setStatus({ type: 'error', msg: err.message || 'Failed to Load Settings.' });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [getToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      const targetLimit = enableLimit ? limitValue : null;
      const apiUrl = import.meta.env.VITE_RPG_API_URL;
      const token = await getToken();

      if (!apiUrl) {
        throw new Error('Admin API configuration missing in Dashboard.');
      }

      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          maxFreeUsers: targetLimit,
          referralSignupReward: signupReward,
          referralPremiumReward: premiumReward
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to Save Settings.');
      }

      setSettings({
        maxFreeUsers: result.maxFreeUsers,
        currentFreeUsers: result.currentFreeUsers,
        referralSignupReward: result.referralSignupReward,
        referralPremiumReward: result.referralPremiumReward
      });
      
      setStatus({ type: 'success', msg: 'System Settings Saved Successfully.' });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setStatus({ type: 'error', msg: err.message || 'Failed to Save Settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex h-[50vh] flex-col items-center justify-center text-brand-text-muted italic gap-2 animate-pulse">
        <div className="h-6 w-6 rounded-full shimmer opacity-50" />
        <p className="text-xs">Loading System Settings...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="System Settings" />

      <form onSubmit={handleSave} className="space-y-4 max-w-xl">
        {/* Card 1: Registration Limits */}
        <div className="card p-4 space-y-4">
          <div>
            <h2 className="section-title mb-1.5 flex items-center gap-2">
              <Settings className="text-brand-accent animate-spin-slow" size={16} />
              Beta Registration Limits
            </h2>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Configure restrictions on the number of free registrations permitted. Once this cap is reached, new signups will be blocked and directed to upgrade to a paid tier. Paid users are never affected by this limit.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-bg rounded-lg border border-brand-primary p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-text-muted flex items-center gap-1">
                <Users size={10} className="text-brand-accent" />
                Current Free Users
              </span>
              <span className="text-header font-bold text-white mt-1.5">{settings.currentFreeUsers}</span>
            </div>
            
            <div className="bg-brand-bg rounded-lg border border-brand-primary p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-text-muted flex items-center gap-1">
                <ShieldAlert size={10} className="text-purple-400" />
                Active Registration Cap
              </span>
              <span className="text-header font-bold text-white mt-1.5">
                {settings.maxFreeUsers !== null ? settings.maxFreeUsers : 'Unlimited'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-brand-bg/50 border border-brand-primary/50 rounded-lg p-3">
              <input 
                type="checkbox"
                id="enableLimit"
                checked={enableLimit}
                onChange={(e) => setEnableLimit(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-accent rounded border-brand-primary focus:ring-brand-accent cursor-pointer"
              />
              <label htmlFor="enableLimit" className="text-xs font-semibold text-brand-text cursor-pointer select-none">
                Enable Registration Cap
              </label>
            </div>

            <AnimatePresence>
              {enableLimit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    <label className="input-label">Max Free Users Limit</label>
                    <input 
                      type="number"
                      required
                      min={0}
                      value={limitValue}
                      onChange={(e) => setLimitValue(Math.max(0, parseInt(e.target.value) || 0))}
                      className="input-field"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Card 2: Referral Rewards */}
        <div className="card p-4 space-y-4">
          <div>
            <h2 className="section-title mb-1.5 flex items-center gap-2">
              <Gift className="text-brand-accent" size={16} />
              Referral Program Settings
            </h2>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Manage credit rewards granted to users under the referral invitation scheme. Changes are applied immediately to all new referrals and plan upgrades.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="input-label">Sign Up Reward (Credits)</label>
              <input 
                type="number"
                required
                min={0}
                value={signupReward}
                onChange={(e) => setSignupReward(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field"
              />
              <span className="text-[10px] text-brand-text-muted leading-tight mt-1 block">
                Credits awarded to both the referrer and referee upon successful new account creation.
              </span>
            </div>

            <div>
              <label className="input-label">Premium Upgrade Reward (Credits)</label>
              <input 
                type="number"
                required
                min={0}
                value={premiumReward}
                onChange={(e) => setPremiumReward(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field"
              />
              <span className="text-[10px] text-brand-text-muted leading-tight mt-1 block">
                Credits awarded to the referrer once the referred friend upgrades to any paid tier plan.
              </span>
            </div>
          </div>
        </div>

        {/* Status and Action Buttons */}
        <AnimatePresence>
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'flex items-start gap-2 rounded-lg p-2.5 text-xs font-medium',
                status.type === 'success' ? 'badge-accent' : 'badge-danger'
              )}
            >
              {status.type === 'success' ? <CheckCircle2 size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
              <span className="flex-1">{status.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          type="submit" 
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
