import React, { useEffect, useState } from 'react';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { Zap, ShieldAlert, Users, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { telemetryService, TelemetryData, BehaviorData } from '../../services/EngineTelemetryService';

const COLORS = ['#00b2ff', '#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

import { Skeleton, ChartSkeleton, SkeletonText } from '../Skeleton';

export default function EngineHealthDashboard() {
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
    const [behavior, setBehavior] = useState<BehaviorData | null>(null);
    const [loading, setLoading] = useState(true);

    const { getToken } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                const [t, b] = await Promise.all([
                    telemetryService.getTelemetry(token as string),
                    telemetryService.getBehavior(token as string)
                ]);
                setTelemetry(t);
                setBehavior(b);
            } catch (error) {
                console.error("Failed to fetch engine health data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isLoading = loading; // Alias for clarity within JSX

    return (
        <div className="space-y-8">
            {/* Engine Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 border-l-4 border-brand-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Median Latency</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-9 mt-2" />
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.latency.p50}ms</h3>
                            )}
                        </div>
                        <Zap className="text-brand-accent" size={20} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Tail Latency (P95)</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-9 mt-2" />
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.latency.p95}ms</h3>
                            )}
                        </div>
                        <TrendingUp className="text-purple-500" size={20} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Intervention Rate</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-9 mt-2" />
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.interventionRate}%</h3>
                            )}
                        </div>
                        <ShieldAlert className="text-emerald-500" size={20} />
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Token Consumption by Phase */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <Filter size={16} className="text-brand-accent" />
                        Token Load By Engine Phase
                    </h4>
                    <div className="h-[300px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-end gap-2 px-2 pb-8 opacity-20 pointer-events-none">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={isLoading ? [] : telemetry?.avgTokensByPhase}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} />
                                <XAxis dataKey="phase" stroke="#8E8E93" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#8E8E93" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                                />
                                <Bar dataKey="avgTokens" fill="#00b2ff" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Tutorial Conversion Funnel */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <Users size={16} className="text-emerald-400" />
                        Tutorial Conversion Funnel
                    </h4>
                    <div className="h-[300px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col gap-2 px-2 py-4 opacity-20 pointer-events-none">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="shimmer h-10 rounded-lg" style={{ width: `${100 - i * 15}%` }} />
                                ))}
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={isLoading ? [] : behavior?.tutorialDropOff} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#292a32" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="event" 
                                    type="category" 
                                    stroke="#8E8E93" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    width={100}
                                    tickFormatter={(val) => val?.replace('tutorial_', '').toUpperCase() || ''}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* GM Mode Preference */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-white mb-6">GM Interaction Preference</h4>
                    <div className="h-[250px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                <div className="h-40 w-40 rounded-full shimmer opacity-20 border-[20px] border-[#292a32]" />
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={isLoading ? [] : behavior?.gmModeRatio}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="mode"
                                >
                                    {behavior?.gmModeRatio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.mode === 'Smart' ? '#6366f1' : '#f97316'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Mechanics */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-white mb-6">Most Triggered Mechanics</h4>
                    <div className="space-y-4">
                        {(isLoading ? Array.from({ length: 4 }) : behavior?.topMechanics || []).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/5">
                                <span className="text-xs font-medium text-brand-text-muted">
                                    {isLoading ? (
                                        <SkeletonText width={120} className="h-3" />
                                    ) : (
                                        item.name.replace('mech_', '').replace('_', ' ').toUpperCase()
                                    )}
                                </span>
                                {isLoading ? (
                                    <SkeletonText width={40} className="h-3" />
                                ) : (
                                    <span className="text-xs font-bold text-brand-accent">{item.count}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
