import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [topConsumers, setTopConsumers] = useState<any[]>([]);
  const [acquisitionData, setAcquisitionData] = useState<any[]>([]);

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
          icon: `https://ui-avatars.com/api/?name=${u.email?.charAt(0) || 'U'}&background=random&color=fff`
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

  return {
    loading,
    totalRevenue,
    revenueData,
    recentSignups,
    topConsumers,
    acquisitionData
  };
}
