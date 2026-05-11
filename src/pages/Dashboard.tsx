import React from 'react';
import { ActiveUsersCard } from '../components/dashboard/ActiveUsersCard';
import { MessagesPerUserChart } from '../components/dashboard/MessagesPerUserChart';
import { FeatureUsageChart } from '../components/dashboard/FeatureUsageChart';
import { CostAnalyticsCard } from '../components/dashboard/CostAnalyticsCard';
import { RetentionTable } from '../components/dashboard/RetentionTable';
import { SessionLengthChart } from '../components/dashboard/SessionLengthChart';
import { ChurnSignalsTable } from '../components/dashboard/ChurnSignalsTable';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <header className="mb-8 border-b border-brand-primary pb-4">
        <h1>Heroic Analytics</h1>
        <p className="text-body text-brand-text-muted mt-1">Real-time telemetry and user insights.</p>
      </header>

      {/* Top Row: Key Metrics */}
        <div className="grid grid-cols-1 gap-6">
          <ActiveUsersCard />
        </div>

        {/* Second Row: Engagement & Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MessagesPerUserChart />
          <FeatureUsageChart />
        </div>

        {/* Third Row: Financials */}
        <div className="grid grid-cols-1 gap-6">
          <CostAnalyticsCard />
        </div>

        {/* Fourth Row: Sessions & Retention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SessionLengthChart />
          <RetentionTable />
        </div>

      {/* Fifth Row: Churn */}
      <div className="grid grid-cols-1 gap-6">
        <ChurnSignalsTable />
      </div>
    </div>
  );
}
