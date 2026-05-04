import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeftRight, ChevronDown, Repeat, Users as UsersIcon, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueFilter, setRevenueFilter] = useState('Month');
  const [signupFilter, setSignupFilter] = useState('6 Months');
  
  // Live State
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [topConsumers, setTopConsumers] = useState<any[]>([]);
  const [acquisitionData, setAcquisitionData] = useState<any[]>([]);
  
  // Estimator State
  const [tokensProcessed, setTokensProcessed] = useState('2,500,000');
  const [estimatedCost, setEstimatedCost] = useState('0.19');
  const [showInputDropdown, setShowInputDropdown] = useState(false);
  const [showUsdDropdown, setShowUsdDropdown] = useState(false);
  const [inputType, setInputType] = useState('Tokens');
  const [currencyType, setCurrencyType] = useState('USD');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Users
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('*')
        .order('createdAt', { ascending: false });

      if (users) {
        setRecentSignups(users.slice(0, 5).map(u => ({
          id: u.id,
          user: u.email,
          date: new Date(u.createdAt).toLocaleDateString(),
          plan: u.tier.charAt(0).toUpperCase() + u.tier.slice(1),
          icon: `https://ui-avatars.com/api/?name=${u.email.charAt(0)}&background=random&color=fff`
        })));
      }

      // 2. Fetch Usage Logs
      const { data: logs, error: logsError } = await supabase
        .from('UsageLog')
        .select('*, User(email)');

      if (logs) {
        // Aggregate Revenue
        const total = logs.reduce((sum, log) => sum + (log.costUsd || 0), 0);
        setTotalRevenue(total * 3); // Mocking a 3x multiplier for "Revenue" vs "API Cost"

        // Process Revenue Trends (Group by Month)
        const monthlyData: Record<string, any> = {};
        logs.forEach(log => {
          const month = new Date(log.createdAt).toLocaleString('default', { month: 'short' });
          if (!monthlyData[month]) monthlyData[month] = { name: month, revenue: 0, apiCost: 0 };
          monthlyData[month].apiCost += log.costUsd;
          monthlyData[month].revenue += log.costUsd * 3;
        });
        setRevenueData(Object.values(monthlyData));

        // Process Top Consumers
        const consumerMap: Record<string, any> = {};
        logs.forEach(log => {
          const email = log.User?.email || 'Unknown';
          if (!consumerMap[email]) {
            consumerMap[email] = { id: log.userId, user: email, model: log.model, cost: 0 };
          }
          consumerMap[email].cost += log.costUsd;
          consumerMap[email].model = log.model; // Last used model
        });
        
        const top = Object.values(consumerMap)
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 4)
          .map((u, idx) => ({
            ...u,
            icon: `https://ui-avatars.com/api/?name=${u.user.charAt(0)}&background=random&color=fff`
          }));
        setTopConsumers(top);

        // Process Acquisition (Mocking breakdown based on real signup volume)
        const signupCount = users?.length || 0;
        setAcquisitionData([
          { name: 'Organic', organic: Math.round(signupCount * 0.5), referral: 0, paid: 0 },
          { name: 'Referral', organic: 0, referral: Math.round(signupCount * 0.3), paid: 0 },
          { name: 'Paid', organic: 0, referral: 0, paid: Math.round(signupCount * 0.2) },
        ]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const calculateCost = (value: string) => {
    const tokens = parseInt(value.replace(/,/g, '')) || 0;
    const cost = (tokens / 1000000) * 0.075;
    setEstimatedCost(cost.toFixed(2));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
          <p className="text-brand-text-muted animate-pulse">Synchronizing With RPG Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white pb-8">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Overview */}
        <div className="glass-panel col-span-1 lg:col-span-2 p-6 flex flex-col relative w-full h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Revenue & API Costs</h3>
              <p className="gap-2 mt-4">
                 <span className="text-3xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-6">
              <div className="flex bg-[#141416] rounded-xl p-1 border border-[#292a32]">
                {['Day', 'Week', 'Month'].map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setRevenueFilter(filter)}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${revenueFilter === filter ? 'bg-white text-black' : 'text-[#8b8c94] hover:text-white'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-[#8b8c94]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                  Revenue
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]"></span>
                  API Costs
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b2ff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00b2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a36" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff5a36" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8b8c94" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#8b8c94" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value >= 1000 ? value/1000 + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00b2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="apiCost" stroke="#ff5a36" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Cost Calculator */}
        <div className="glass-panel col-span-1 p-6 relative h-[380px] flex flex-col">
          <h3 className="text-xl font-bold mb-6">Token Estimator</h3>
          
          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 relative">
              <label className="text-xs text-[#8b8c94] font-medium mb-1 block">Tokens Processed</label>
              <div className="flex justify-between items-center mt-2">
                <input 
                  type="text" 
                  value={tokensProcessed}
                  onChange={(e) => {
                    setTokensProcessed(e.target.value);
                    calculateCost(e.target.value);
                  }}
                  className="bg-transparent text-3xl font-bold flex-1 min-w-0 mr-4 outline-none" 
                />
                <div className="relative">
                  <button 
                    onClick={() => setShowInputDropdown(!showInputDropdown)}
                    className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                      <div className="w-2 h-2 bg-indigo-400 rounded-sm"></div>
                    </span>
                    {inputType} <ChevronDown size={14} className="text-[#8b8c94]"/>
                  </button>
                  
                  <AnimatePresence>
                    {showInputDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-[#1d1e24] border border-[#292a32] shadow-xl overflow-hidden z-10"
                      >
                        {['Tokens', 'Words', 'Chars'].map(type => (
                          <button 
                            key={type}
                            onClick={() => {
                              setInputType(type);
                              setShowInputDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-brand-text-muted hover:bg-[#292a32] hover:text-white transition-colors"
                          >
                            {type}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-xs text-[#8b8c94] mt-2 font-medium">Gemini 3.1 Flash</p>
            </div>

            <div className="bg-[#141416] rounded-3xl border border-[#292a32] p-5 mt-4">
              <label className="text-xs text-[#8b8c94] font-medium mb-1 block">Estimated Cost</label>
              <div className="flex justify-between items-center mt-2">
                <input 
                  type="text" 
                  value={estimatedCost} 
                  className="bg-transparent text-3xl font-bold flex-1 min-w-0 mr-4 outline-none" 
                  readOnly
                />
                <div className="relative">
                  <button 
                    onClick={() => setShowUsdDropdown(!showUsdDropdown)}
                    className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                      <div className="text-[10px] font-bold text-emerald-400">{currencyType === 'USD' ? '$' : currencyType === 'EUR' ? '€' : 'C'}</div>
                    </span>
                    {currencyType} <ChevronDown size={14} className="text-[#8b8c94]"/>
                  </button>
                  
                  <AnimatePresence>
                    {showUsdDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-[#1d1e24] border border-[#292a32] shadow-xl overflow-hidden z-10"
                      >
                        {['USD', 'EUR', 'Credits'].map(type => (
                          <button 
                            key={type}
                            onClick={() => {
                              setCurrencyType(type);
                              setShowUsdDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-brand-text-muted hover:bg-[#292a32] hover:text-white transition-colors"
                          >
                            {type}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-xs text-[#8b8c94] mt-2 font-medium">~$0.075 / 1M tokens</p>
            </div>
            

          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* User Acquisition */}
        <div className="glass-panel p-6 h-[340px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">New Signups</h3>
            <button 
              onClick={() => setSignupFilter(signupFilter === '6 Months' ? '30 Days' : '6 Months')}
              className="flex items-center gap-2 bg-[#141416] border border-[#292a32] px-3 py-1.5 rounded-lg text-xs font-medium text-[#8b8c94] hover:text-white transition-colors"
            >
              {signupFilter} <ChevronDown size={14} />
            </button>
          </div>
          
          <div className="h-32 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisitionData} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292a32" vertical={false} horizontal={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8b8c94" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <Tooltip cursor={{fill: '#292a32', opacity: 0.2}} contentStyle={{ backgroundColor: '#1d1e24', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="organic" fill="#00b2ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referral" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill="#ff5a36" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> Organic  <span className="text-[#292a32] mx-1">|</span> (50%)
              </div>
              <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Organic')?.organic || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Referral  <span className="text-[#292a32] mx-1">|</span> (30%)
              </div>
              <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Referral')?.referral || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]"></span> Paid Ads  <span className="text-[#292a32] mx-1">|</span> (20%)
              </div>
              <span className="font-bold text-white">{acquisitionData.find(d => d.name === 'Paid')?.paid || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="glass-panel p-6 h-[340px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Recent Signups</h3>
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="flex items-center text-[11px] font-medium text-[#8b8c94] mb-4 pb-2 border-b border-[#292a32] px-2">
            <span className="flex-1">User</span>
            <span className="w-24 text-center">Time</span>
            <span className="w-20 text-right">Plan</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {recentSignups.map(signup => (
              <div key={signup.id} className="flex items-center p-2 rounded-xl hover:bg-[#292a32] transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#292a32] shrink-0">
                    <img src={signup.icon} alt={signup.user} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-[#e2e2e2] truncate" title={signup.user}>{signup.user}</span>
                </div>
                <span className="text-[11px] text-[#8b8c94] w-24 text-center shrink-0">{signup.date}</span>
                <span className="text-xs font-bold text-white w-20 text-right shrink-0">{signup.plan}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Volume Users */}
        <div className="glass-panel p-6 h-[340px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Top Consumers</h3>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="flex items-center text-[11px] font-medium text-[#8b8c94] mb-4 pb-2 border-b border-[#292a32] px-2">
            <span className="flex-1">Customer</span>
            <span className="w-24 text-center">Top Model</span>
            <span className="w-20 text-right">Spend</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {topConsumers.map((tx, idx) => (
              <div key={tx.id} className={`flex items-center p-2 rounded-xl transition-colors ${idx === 1 ? 'bg-[#292a32]' : 'hover:bg-[#292a32]'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#292a32] shrink-0">
                    <img src={tx.icon} alt={tx.user} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-[#e2e2e2] truncate" title={tx.user}>{tx.user}</span>
                </div>
                <span className="text-[11px] text-[#8b8c94] w-24 text-center shrink-0">{tx.model}</span>
                <span className="text-xs font-bold text-emerald-400 w-20 text-right shrink-0">${tx.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
