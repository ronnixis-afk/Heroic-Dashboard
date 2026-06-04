import React from 'react';
import { Mail, X, Zap, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserConsumptionChart from './UserConsumptionChart';
import { useAuth } from '../../lib/AuthContext';
import { telemetryService, TelemetryData } from '../../services/EngineTelemetryService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface UserDetailModalProps {
  selectedUser: any;
  handleCloseModal: () => void;
  showManageAccess: boolean;
  setShowManageAccess: (show: boolean) => void;
  showSuspendConfirm: boolean;
  setShowSuspendConfirm: (show: boolean) => void;
}

import { Skeleton } from '../Skeleton';

export default function UserDetailModal({
  selectedUser,
  handleCloseModal,
  showManageAccess,
  setShowManageAccess,
  showSuspendConfirm,
  setShowSuspendConfirm
}: UserDetailModalProps) {
  const [telemetry, setTelemetry] = React.useState<TelemetryData | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = React.useState(false);
  const { getToken } = useAuth();

  React.useEffect(() => {
    if (!selectedUser?.id) return;

    let cancelled = false;
    const loadTelemetry = async () => {
      setLoadingTelemetry(true);
      try {
        const token = await getToken();
        const data = await telemetryService.getTelemetry(token || undefined, selectedUser.id);
        if (!cancelled) setTelemetry(data);
      } catch (err) {
        console.error('[UserDetailModal] Telemetry fetch failed:', err);
      } finally {
        if (!cancelled) setLoadingTelemetry(false);
      }
    };

    loadTelemetry();
    return () => {
      cancelled = true;
    };
  }, [selectedUser, getToken]);

  if (!selectedUser) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleCloseModal}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed right-0 top-0 z-50 h-full w-full md:max-w-[50vw] border-l border-brand-primary bg-[#111114] p-8 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">User Details</h2>
          <button 
            onClick={handleCloseModal}
            className="rounded-full p-2 text-brand-text-muted hover:bg-brand-primary/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-accent/20 to-purple-500/20 border border-brand-primary flex items-center justify-center text-brand-accent">
              <Mail size={32} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-white truncate" title={selectedUser.email}>
                {selectedUser.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-brand-text-muted font-mono truncate">ID: {selectedUser.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 flex flex-col justify-between border border-brand-primary/50">
              <div>
                <h4 className="text-xs font-bold text-brand-text-muted mb-4">Account Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-muted">Membership Tier</span>
                    <span className="px-3 py-1 bg-brand-primary/30 rounded-full text-[10px] font-bold text-brand-accent border border-brand-accent/20">
                      {selectedUser.tier ? (selectedUser.tier.charAt(0).toUpperCase() + selectedUser.tier.slice(1)) : 'Newbie'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-muted">Email Address</span>
                    <span className="text-white font-medium truncate max-w-[150px]">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-text-muted">Status</span>
                    {(() => {
                      const lastSession = selectedUser.UserSession?.[0];
                      const isOnline = lastSession && 
                                       !lastSession.endTime && 
                                       (new Date().getTime() - new Date(lastSession.lastPing).getTime() < 5 * 60 * 1000);
                      if (isOnline) {
                        return (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        );
                      }
                      return (
                        <span className="flex items-center gap-1.5 text-brand-text-muted font-bold">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-text-muted/60" />
                          Offline
                        </span>
                      );
                    })()}
                  </div>
                  {(() => {
                    const lastSession = selectedUser.UserSession?.[0];
                    if (!lastSession) return null;
                    return (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-brand-text-muted">Last Seen</span>
                        <span className="text-white font-medium">
                          {new Date(lastSession.lastPing).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-brand-text-muted mb-1">Administrative Actions</h4>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]">
                Manage Credits
              </button>
              <button className="w-full py-3 bg-brand-primary/50 text-white font-bold rounded-xl border border-brand-primary hover:bg-brand-primary transition-all active:scale-[0.98]">
                Suspend Access
              </button>
            </div>
          </div>

          <div className="pt-2">
            <UserConsumptionChart userId={selectedUser.id} />
          </div>

          {/* Engine Health (User Specific) */}
          <div className="pt-6 border-t border-brand-primary/10">
            <h4 className="text-sm font-bold text-brand-text-muted mb-4 flex items-center gap-2">
              <Activity size={16} className="text-brand-accent" />
              Engine Performance
            </h4>
            
            {loadingTelemetry ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton width="100%" height={80} />
                  <Skeleton width="100%" height={80} />
                </div>
                <Skeleton width="100%" height={150} />
              </div>
            ) : telemetry ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass-panel p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-brand-text-muted">Avg Latency (P50)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-white">{telemetry.latency.p50}ms</span>
                        <Zap size={14} className="text-brand-accent" />
                    </div>
                </div>
                <div className="glass-panel p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-brand-text-muted">Intervention Rate</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-white">{telemetry.interventionRate}%</span>
                        <ShieldAlert size={14} className={telemetry.interventionRate > 10 ? 'text-red-400' : 'text-emerald-400'} />
                    </div>
                </div>
                
                <div className="glass-panel p-4 col-span-1 md:col-span-2 h-[150px]">
                    <span className="text-[10px] text-brand-text-muted mb-2 block">Tokens Per Phase</span>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetry.avgTokensByPhase}>
                            <defs>
                                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#20cce0" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#20cce0" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="phase" hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                                labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                            />
                            <Area type="monotone" dataKey="avgTokens" stroke="#20cce0" fillOpacity={1} fill="url(#colorTokens)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic">No telemetry data available for this user.</p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

