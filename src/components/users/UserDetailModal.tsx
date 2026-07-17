import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, Zap, Activity, Database, Eye, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import UserConsumptionChart from './UserConsumptionChart';
import { useAuth } from '../../lib/AuthContext';
import { telemetryService, TelemetryData } from '../../services/EngineTelemetryService';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Skeleton } from '../Skeleton';
import { getSupabaseClient } from '../../lib/supabase';
import { formatBytes } from '../../lib/utils';

interface UserDetailModalProps {
  selectedUser: any;
  handleCloseModal: () => void;
}

export default function UserDetailModal({
  selectedUser,
  handleCloseModal,
}: UserDetailModalProps) {
  const navigate = useNavigate();
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

  const [saves, setSaves] = React.useState<any[]>([]);
  const [loadingSaves, setLoadingSaves] = React.useState(false);

  React.useEffect(() => {
    if (!selectedUser?.id) return;

    let cancelled = false;
    const loadSaves = async () => {
      setLoadingSaves(true);
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        const { data, error } = await supabase
          .from('game_save_metadata')
          .select('*')
          .eq('userId', selectedUser.id)
          .order('updatedAt', { ascending: false });

        if (error) throw error;
        if (!cancelled) setSaves(data || []);
      } catch (err) {
        console.error('[UserDetailModal] Saves fetch failed:', err);
      } finally {
        if (!cancelled) setLoadingSaves(false);
      }
    };

    loadSaves();
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
        className="fixed right-0 top-0 z-50 h-full w-full md:max-w-[50vw] border-l border-brand-border bg-sidebar-bg p-3.5 shadow-2xl overflow-y-auto"
      >
        <div className="card-header mb-4">
          <h2 className="text-title font-semibold text-white">User Details</h2>
          <button 
            onClick={handleCloseModal}
            className="btn-icon"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
              <Mail size={18} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <h3 className="text-header font-semibold text-white truncate" title={selectedUser.email}>
                {selectedUser.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-brand-text-muted font-mono truncate">ID: {selectedUser.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="card p-3.5 flex flex-col justify-between">
              <div>
                <h4 className="input-label mb-2">Account Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text-muted">Membership Tier</span>
                    <span className="badge-accent">
                      {selectedUser.tier ? (selectedUser.tier.charAt(0).toUpperCase() + selectedUser.tier.slice(1)) : 'Newbie'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text-muted">Email Address</span>
                    <span className="text-white font-medium truncate max-w-[150px]">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text-muted">Status</span>
                    {(() => {
                      const lastSession = selectedUser.UserSession?.[0];
                      const isOnline = lastSession && 
                                       !lastSession.endTime && 
                                       (new Date().getTime() - new Date(lastSession.lastPing).getTime() < 5 * 60 * 1000);
                      if (isOnline) {
                        return (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        );
                      }
                      return (
                        <span className="flex items-center gap-1.5 text-brand-text-muted font-semibold">
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
                      <div className="flex justify-between items-center text-xs">
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

            <div className="flex flex-col gap-2">
              <h4 className="input-label">Administrative Actions</h4>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => {
                  handleCloseModal();
                  const email = selectedUser.email || '';
                  navigate(
                    `/admin/credits?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(selectedUser.id)}`
                  );
                }}
              >
                Manage Credits
              </button>
            </div>
          </div>

          {/* Cloud Saves Metadata */}
          <div className="card p-3.5">
            <h4 className="section-title mb-3 flex items-center gap-2">
              <Database size={14} className="text-brand-accent" />
              Cloud Save Files ({saves.length})
            </h4>
            
            {loadingSaves ? (
              <div className="space-y-2">
                <Skeleton width="100%" height={40} className="rounded-md" />
                <Skeleton width="100%" height={40} className="rounded-md" />
              </div>
            ) : saves.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {saves.map((save) => (
                  <div 
                    key={save.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-md bg-brand-bg border border-brand-primary/45 hover:border-brand-accent/40 transition-all gap-1.5"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate" title={save.name}>
                          {save.name}
                        </span>
                        <span className="badge-muted font-mono truncate max-w-[120px]" title={save.worldId}>
                          {save.worldId}
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-muted flex items-center gap-1">
                        <span>Last Saved:</span>
                        <span>
                          {new Date(save.updatedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold font-mono text-brand-accent bg-brand-accent/5 px-2 py-0.5 rounded border border-brand-accent/10">
                        {formatBytes(save.size_bytes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic py-1">No active cloud save files found.</p>
            )}
          </div>

          <div>
            <UserConsumptionChart userId={selectedUser.id} />
          </div>

          <div className="pt-3 border-t border-brand-primary/10">
            <h4 className="section-title mb-3 flex items-center gap-2">
              <Activity size={14} className="text-brand-accent" />
              Engine Performance
            </h4>
            
            {loadingTelemetry ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton width="100%" height={64} />
                  <Skeleton width="100%" height={64} />
                </div>
                <Skeleton width="100%" height={120} />
              </div>
            ) : telemetry ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="card p-3 flex flex-col justify-center">
                    <span className="input-label mb-0">Avg Latency (P50)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="card-metric">{telemetry.latency.p50}ms</span>
                        <Zap size={12} className="text-brand-accent" />
                    </div>
                </div>
                <div className="card p-3 flex flex-col justify-center">
                    <span className="input-label mb-0">Intervention Rate</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="card-metric">{telemetry.interventionRate}%</span>
                        <ShieldAlert size={12} className={telemetry.interventionRate > 10 ? 'text-red-400' : 'text-emerald-400'} />
                    </div>
                </div>
                
                <div className="card p-3 col-span-1 md:col-span-2 h-[120px]">
                    <span className="input-label mb-1">Tokens Per Phase</span>
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
                                contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
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
