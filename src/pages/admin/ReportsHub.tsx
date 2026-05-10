import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowRight,
  PieChart,
  Activity
} from 'lucide-react';

const REPORT_CARDS = [
  {
    title: 'Audience Reports',
    description: 'Deep dive into user growth, retention, and churn signals. Understand who your power users are.',
    icon: Users,
    path: '/admin/reports/audience',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10'
  },
  {
    title: 'Usage Reports',
    description: 'Analyze feature adoption, session lengths, and model distribution. Optimize your product experience.',
    icon: Search,
    path: '/admin/reports/usage',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10'
  },
  {
    title: 'Financial Reports',
    description: 'Monitor revenue, API costs, and net profit margins. Track the financial health of your AI services.',
    icon: DollarSign,
    path: '/admin/reports/financial',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10'
  },
  {
    title: 'Real-Time Analytics',
    description: 'Live view of current sessions, token consumption, and engine health status.',
    icon: Activity,
    path: '/admin/analytics',
    color: 'text-brand-accent',
    bgColor: 'bg-brand-accent/10'
  }
];

export default function ReportsHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">Reports Hub</h1>
        <p className="text-brand-text-muted mt-2">Comprehensive intelligence and data analysis for the Heroic ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_CARDS.map((report, idx) => (
          <motion.div
            key={report.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(report.path)}
            className="glass-panel p-8 cursor-pointer group hover:border-brand-accent/50 transition-all border border-brand-primary/20 flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${report.bgColor} ${report.color}`}>
                <report.icon size={32} />
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-brand-primary/20 text-brand-text-muted group-hover:bg-brand-accent group-hover:text-white transition-all">
                <ArrowRight size={20} />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-accent transition-colors">
              {report.title}
            </h3>
            <p className="text-brand-text-muted leading-relaxed flex-1">
              {report.description}
            </p>
            
            <div className="mt-8 pt-6 border-t border-brand-primary/10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-brand-surface bg-brand-primary flex items-center justify-center text-[8px] font-bold">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-brand-text-muted">Specialized Data Views Available</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
