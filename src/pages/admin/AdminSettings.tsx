import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { fetchRpgAdmin } from '../../lib/rpgAdminApi';
import { Settings, ShieldAlert, Users, Gift } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader, StatusBanner, PageLoader } from '../../components/ui';

interface SettingsData {
  maxFreeUsers: number | null;
  currentFreeUsers: number;
  referralSignupReward: number;
  referralPremiumReward: number;
  defaultModel: string;
  npcPortraitSource: string;
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
    referralPremiumReward: 1000,
    defaultModel: 'gemini-3.1-flash-lite',
    npcPortraitSource: 'database',
  });

  const [enableLimit, setEnableLimit] = useState(false);
  const [limitValue, setLimitValue] = useState<number>(100);
  const [signupReward, setSignupReward] = useState<number>(200);
  const [premiumReward, setPremiumReward] = useState<number>(1000);
  const [defaultModel, setDefaultModel] = useState<string>('gemini-3.1-flash-lite');
  const [npcPortraitSource, setNpcPortraitSource] = useState<string>('database');

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
        setDefaultModel(data.defaultModel || 'gemini-3.1-flash-lite');
        setNpcPortraitSource(data.npcPortraitSource || 'database');
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        const raw = err?.message || '';
        const isNetworkError = /could not reach rpg api|failed to fetch|networkerror|load failed/i.test(raw);
        setStatus({
          type: 'error',
          msg: isNetworkError
            ? raw || 'Could Not Reach The RPG API. Confirm VITE_RPG_API_URL And That The RPG Server Is Running.'
            : raw || 'Failed To Load Settings.',
        });
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

      // Use the same authenticated helper as load — raw fetch can surface opaque
      // "Failed to fetch" errors when the RPG API is unreachable or CORS blocks POST.
      const result = await fetchRpgAdmin<SettingsData & { success?: boolean }>(
        '/api/admin/settings',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({
            maxFreeUsers: targetLimit,
            referralSignupReward: signupReward,
            referralPremiumReward: premiumReward,
            defaultModel: defaultModel,
            npcPortraitSource: npcPortraitSource,
          }),
        }
      );

      setSettings({
        maxFreeUsers: result.maxFreeUsers,
        currentFreeUsers: result.currentFreeUsers,
        referralSignupReward: result.referralSignupReward,
        referralPremiumReward: result.referralPremiumReward,
        defaultModel: result.defaultModel,
        npcPortraitSource: result.npcPortraitSource || 'database',
      });
      setDefaultModel(result.defaultModel || 'gemini-3.1-flash-lite');
      setNpcPortraitSource(result.npcPortraitSource || 'database');

      setStatus({ type: 'success', msg: 'System Settings Saved Successfully.' });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const raw = err?.message || '';
      const isNetworkError = /failed to fetch|networkerror|load failed/i.test(raw);
      setStatus({
        type: 'error',
        msg: isNetworkError
          ? 'Could Not Reach The RPG API. Confirm VITE_RPG_API_URL And That The RPG Server Is Running, Then Try Again.'
          : raw || 'Failed To Save Settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading System Settings..." />;
  }

  return (
    <div className="page">
      <PageHeader
        title="System Settings"
        description="Configure Registration Caps, Referral Rewards, AI Model Routing, And NPC Image Source."
      />

      {status && (
        <StatusBanner
          type={status.type}
          message={status.msg}
          onDismiss={() => setStatus(null)}
        />
      )}

      <form onSubmit={handleSave} className="space-y-3 max-w-xl">
        <div className="card p-3.5 space-y-3">
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2">
              <Settings className="text-brand-accent" size={14} />
              Beta Registration Limits
            </h2>
            <p className="help-text">
              Cap free registrations. When reached, new signups are directed to paid tiers. Paid users are unaffected.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="metric-tile">
              <span className="stat-label flex items-center gap-1">
                <Users size={12} className="text-brand-accent" />
                Current Free Users
              </span>
              <span className="card-metric mt-1.5">{settings.currentFreeUsers}</span>
            </div>

            <div className="metric-tile">
              <span className="stat-label flex items-center gap-1">
                <ShieldAlert size={12} className="text-brand-text-muted" />
                Active Registration Cap
              </span>
              <span className="card-metric mt-1.5">
                {settings.maxFreeUsers !== null ? settings.maxFreeUsers : 'Unlimited'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 rounded-md border border-brand-primary/50 bg-brand-bg/50 p-3">
              <input
                type="checkbox"
                id="enableLimit"
                checked={enableLimit}
                onChange={(e) => setEnableLimit(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-accent rounded border-brand-primary cursor-pointer"
              />
              <label htmlFor="enableLimit" className="text-xs font-medium text-brand-text cursor-pointer select-none">
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

        <div className="card p-3.5 space-y-3">
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2">
              <Gift className="text-brand-accent" size={14} />
              Referral Program Settings
            </h2>
            <p className="help-text">
              Credit rewards for new referrals and premium upgrades. Changes apply to new events immediately.
            </p>
          </div>

          <div className="space-y-3">
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
              <p className="help-text mt-1">
                Credits awarded to both referrer and referee on successful signup.
              </p>
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
              <p className="help-text mt-1">
                Credits awarded to the referrer when the friend upgrades to a paid plan.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-3.5 space-y-3">
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2">
              <Settings className="text-brand-accent" size={14} />
              AI Model Routing
            </h2>
            <p className="help-text">
              Primary model for narration, GM logic, combat, and NPC interactions. Takes effect immediately.
            </p>
          </div>

          <div>
            <label className="input-label">Default Text Model</label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
              <option value="deepseek-v4-flash">DeepSeek V4 Flash (Reasoning)</option>
            </select>
            <p className="help-text mt-1">
              Used for standard game turns, intents, and narrative generation.
            </p>
          </div>
        </div>

        <div className="card p-3.5 space-y-3">
          <div>
            <h2 className="section-title mb-1 flex items-center gap-2">
              <Settings className="text-brand-accent" size={14} />
              Image Generation Routing
            </h2>
            <p className="help-text">
              Primary source for nearby NPC portraits. Database uses Media Library assets at no image credit cost. Nano Banana 2 Lite bills image credits; Database is always the fallback.
            </p>
          </div>

          <div>
            <label className="input-label">NPC Image Source</label>
            <select
              value={npcPortraitSource}
              onChange={(e) => setNpcPortraitSource(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="database">Database</option>
              <option value="nano_banana_2_lite">Nano Banana 2 Lite</option>
            </select>
            <p className="help-text mt-1">
              Default is Database. Takes effect within about 15 seconds for active sessions.
            </p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
