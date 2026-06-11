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
import { useAuth } from '../../lib/AuthContext';
import { telemetryService, TelemetryData, BehaviorData } from '../../services/EngineTelemetryService';
import { SkeletonText } from '../Skeleton';

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
    }, [getToken]);

    const isLoading = loading;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-3.5 border-l-4 border-brand-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="input-label mb-0">Median Latency</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-5 mt-1" />
                            ) : (
                                <p className="card-metric mt-1">{telemetry?.latency.p50}ms</p>
                            )}
                        </div>
                        <Zap className="text-brand-accent" size={14} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="card p-3.5 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="input-label mb-0">Tail Latency (P95)</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-5 mt-1" />
                            ) : (
                                <p className="card-metric mt-1">{telemetry?.latency.p95}ms</p>
                            )}
                        </div>
                        <TrendingUp className="text-purple-500" size={14} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card p-3.5 border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="input-label mb-0">Intervention Rate</p>
                            {isLoading ? (
                                <SkeletonText width={80} className="h-5 mt-1" />
                            ) : (
                                <p className="card-metric mt-1">{telemetry?.interventionRate}%</p>
                            )}
                        </div>
                        <ShieldAlert className="text-emerald-500" size={14} />
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-3.5">
                    <h4 className="card-title mb-3 flex items-center gap-2">
                        <Filter size={12} className="text-brand-accent" />
                        Token Load By Engine Phase
                    </h4>
                    <div className="h-[240px] relative">
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
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                                    labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                                />
                                <Bar dataKey="avgTokens" fill="#20cce0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-3.5">
                    <h4 className="card-title mb-3 flex items-center gap-2">
                        <Users size={12} className="text-emerald-400" />
                        Tutorial Conversion Funnel
                    </h4>
                    <div className="h-[240px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col gap-2 px-2 py-4 opacity-20 pointer-events-none">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="shimmer h-8 rounded-lg" style={{ width: `${100 - i * 15}%` }} />
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
                                    tickFormatter={(val) => {
                                      const label = val?.replace('tutorial_', '') || '';
                                      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
                                    }}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                                    labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-3.5">
                    <h4 className="card-title mb-3">GM Interaction Preference</h4>
                    <div className="h-[200px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                <div className="h-32 w-32 rounded-full shimmer opacity-20 border-[16px] border-[#292a32]" />
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={isLoading ? [] : behavior?.gmModeRatio}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="mode"
                                >
                                    {behavior?.gmModeRatio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.mode === 'Smart' ? '#6366f1' : '#f97316'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                                    labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
                                />
                                <Legend verticalAlign="bottom" height={28}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-3.5">
                    <h4 className="card-title mb-3">Most Triggered Mechanics</h4>
                    <div className="space-y-2">
                        {(isLoading ? Array.from({ length: 4 }) : behavior?.topMechanics || []).map((item: any, i: number) => (
                            <div key={i} className="list-item justify-between p-2 rounded-md bg-brand-primary/10 border border-brand-primary/5">
                                <span className="text-xs font-medium text-brand-text-muted">
                                    {isLoading ? (
                                        <SkeletonText width={120} className="h-3" />
                                    ) : (
                                        (() => {
                                          const label = item.name.replace('mech_', '').replace('_', ' ');
                                          return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
                                        })()
                                    )}
                                </span>
                                {isLoading ? (
                                    <SkeletonText width={40} className="h-3" />
                                ) : (
                                    <span className="text-xs font-semibold text-brand-accent">{item.count}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
