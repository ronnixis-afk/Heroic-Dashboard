import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeftRight, ChevronDown, Repeat } from 'lucide-react';

const revenueData = [
  { name: 'Jan', revenue: 4000, apiCost: 2400 },
  { name: 'Feb', revenue: 3000, apiCost: 1398 },
  { name: 'Mar', revenue: 9000, apiCost: 4000 },
  { name: 'Apr', revenue: 5000, apiCost: 3908 },
  { name: 'May', revenue: 11000, apiCost: 8000 },
  { name: 'Jun', revenue: 13000, apiCost: 6000 },
  { name: 'Jul', revenue: 14000, apiCost: 10000 },
  { name: 'Aug', revenue: 10000, apiCost: 5000 },
  { name: 'Sep', revenue: 18000, apiCost: 12000 },
  { name: 'Oct', revenue: 15000, apiCost: 9000 },
  { name: 'Nov', revenue: 20000, apiCost: 13000 },
  { name: 'Dec', revenue: 23000, apiCost: 16000 },
];

const acquisitionData = [
  { name: 'Jan', organic: 40, referral: 24, paid: 24 },
  { name: 'Feb', organic: 30, referral: 13, paid: 22 },
  { name: 'Mar', organic: 20, referral: 50, paid: 22 },
  { name: 'Apr', organic: 27, referral: 39, paid: 20 },
  { name: 'May', organic: 18, referral: 48, paid: 21 },
  { name: 'Jun', organic: 23, referral: 38, paid: 25 },
];

const recentSignups = [
  { id: 1, user: 'knight_errant@heroic.app', date: '3 mins ago', plan: 'Hero', icon: 'https://ui-avatars.com/api/?name=K&background=ff0000&color=fff' },
  { id: 2, user: 'wizard@rpg.com', date: '12 mins ago', plan: 'Adventurer', icon: 'https://ui-avatars.com/api/?name=W&background=FF9900&color=fff' },
  { id: 3, user: 'rogue@guild.net', date: '1 hour ago', plan: 'Hero', icon: 'https://ui-avatars.com/api/?name=R&background=0055FF&color=fff' },
  { id: 4, user: 'cleric@temple.org', date: '2 hours ago', plan: 'Free', icon: 'https://ui-avatars.com/api/?name=C&background=F24E1E&color=fff' },
];

const topConsumers = [
  { id: 1, user: 'dragon_slayer', model: 'gemini-3.1-flash', cost: 1254.99, icon: 'https://ui-avatars.com/api/?name=DS&background=EA4C89&color=fff' },
  { id: 2, user: 'dungeon_master', model: 'gemini-3-pro-img', cost: 820.00, icon: 'https://ui-avatars.com/api/?name=DM&background=FF0000&color=fff' },
  { id: 3, user: 'lore_seeker', model: 'gemini-2.5-tts', cost: 345.00, icon: 'https://ui-avatars.com/api/?name=LS&background=000&color=fff' },
  { id: 4, user: 'epic_bard', model: 'gemini-2.0-flash', cost: 120.00, icon: 'https://ui-avatars.com/api/?name=EB&background=10A37F&color=fff' },
];

export default function AdminDashboard() {
  const [revenueFilter, setRevenueFilter] = useState('Month');
  const [signupFilter, setSignupFilter] = useState('6 months');
  const [tokensProcessed, setTokensProcessed] = useState('2,500,000');
  const [estimatedCost, setEstimatedCost] = useState('0.19');

  const handleCalculateCost = () => {
    const tokens = parseInt(tokensProcessed.replace(/,/g, '')) || 0;
    const cost = (tokens / 1000000) * 0.075;
    setEstimatedCost(cost.toFixed(2));
  };

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
                 <span className="text-3xl font-bold">$14,642.53</span>
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
                  onChange={(e) => setTokensProcessed(e.target.value)}
                  className="bg-transparent text-3xl font-bold flex-1 min-w-0 mr-4 outline-none" 
                />
                <button className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                    <div className="w-2 h-2 bg-indigo-400 rounded-sm"></div>
                  </span>
                  Input <ChevronDown size={14} className="text-[#8b8c94]"/>
                </button>
              </div>
              <p className="text-xs text-[#8b8c94] mt-2 font-medium">Gemini 3.1 Flash</p>
              
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1d1e24] border border-[#292a32] flex items-center justify-center z-10 cursor-pointer hover:bg-[#292a32] transition-colors shadow-lg">
                <ArrowLeftRight size={14} className="text-[#8b8c94] rotate-90" />
              </div>
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
                <button className="shrink-0 flex items-center gap-2 bg-[#1d1e24] border border-[#292a32] px-3 py-1.5 rounded-full text-sm font-medium">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                    <div className="text-[10px] font-bold text-emerald-400">$</div>
                  </span>
                  USD <ChevronDown size={14} className="text-[#8b8c94]"/>
                </button>
              </div>
              <p className="text-xs text-[#8b8c94] mt-2 font-medium">~$0.075 / 1M tokens</p>
            </div>
            
            <button onClick={handleCalculateCost} className="w-full bg-white text-black py-4 rounded-full font-bold text-sm mt-6 hover:bg-gray-200 active:scale-[0.98] transition-all">
              Calculate Cost
            </button>
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
              onClick={() => setSignupFilter(signupFilter === '6 months' ? '30 days' : '6 months')}
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
              <span className="font-bold text-white">2,450</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Referral  <span className="text-[#292a32] mx-1">|</span> (32%)
              </div>
              <span className="font-bold text-white">1,563</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-[#8b8c94] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]"></span> Paid Ads  <span className="text-[#292a32] mx-1">|</span> (18%)
              </div>
              <span className="font-bold text-white">1,152</span>
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="glass-panel p-6 h-[340px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Recent Signups</h3>
            <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
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
            <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
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
