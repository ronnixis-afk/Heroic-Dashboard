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
import { telemetryService, TelemetryData, BehaviorData } from '../../services/EngineTelemetryService';

const COLORS = ['#00b2ff', '#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

export default function EngineHealthDashboard() {
    const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
    const [behavior, setBehavior] = useState<BehaviorData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [t, b] = await Promise.all([
                    telemetryService.getTelemetry(),
                    telemetryService.getBehavior()
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

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Engine Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 border-l-4 border-brand-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Median Latency</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.latency.p50}ms</h3>
                        </div>
                        <Zap className="text-brand-accent" size={20} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Tail Latency (P95)</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.latency.p95}ms</h3>
                        </div>
                        <TrendingUp className="text-purple-500" size={20} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Intervention Rate</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{telemetry?.interventionRate}%</h3>
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
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={telemetry?.avgTokensByPhase}>
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
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={behavior?.tutorialDropOff} layout="vertical">
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
                                    tickFormatter={(val) => val.replace('tutorial_', '').toUpperCase()}
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
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={behavior?.gmModeRatio}
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
                        {behavior?.topMechanics.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/5">
                                <span className="text-xs font-medium text-brand-text-muted">
                                    {item.name.replace('mech_', '').replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-brand-accent">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
