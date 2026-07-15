import { Globe, Image, Map, UserCircle, Mic } from 'lucide-react';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { SkeletonText } from '../Skeleton';

const PRODUCT_FEATURES = [
  {
    key: 'World Building',
    label: 'World Building',
    description: 'World Creation Wizard & Locations',
    icon: Globe,
  },
  {
    key: 'Actor Portrait',
    label: 'Actor Portraits',
    description: 'Nearby Actors & Portrait Queue',
    icon: Image,
  },
  {
    key: 'Scene Generation',
    label: 'Scene Generation',
    description: 'Atmosphere & Visual Scenes',
    icon: Map,
  },
  {
    key: 'Profile Picture',
    label: 'Profile Pictures',
    description: 'Character Portrait Generation',
    icon: UserCircle,
  },
  {
    key: 'Transcription',
    label: 'Transcription',
    description: 'Voice Input',
    icon: Mic,
  },
] as const;

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ProductUsageInsight() {
  const { featureUsage, loading } = useAnalyticsMetrics();

  const rows = PRODUCT_FEATURES.map((def) => {
    const match = featureUsage.usage.find(
      (f) => f.feature.toLowerCase() === def.key.toLowerCase()
    );
    return {
      ...def,
      totalUses: match?.totalUses || 0,
      uniqueUsers: match?.uniqueUsers || 0,
      avgDurationMs: match?.avgDurationMs || 0,
      percentage: match?.percentage || 0,
    };
  });

  const activeProductTypes = rows.filter((r) => r.totalUses > 0).length;

  return (
    <div className="card p-3.5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="card-title">Product Surfaces (30 Days)</h3>
          <p className="help-text mt-0.5">
            AI usage tied to world creation, portraits, scenes, and voice.
          </p>
        </div>
        {!loading && (
          <p className="help-text shrink-0">
            {activeProductTypes} Of {PRODUCT_FEATURES.length} Active
            {featureUsage.chatOnlyUsers > 0
              ? ` · ${featureUsage.chatOnlyUsers.toLocaleString()} Chat-Only Users`
              : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="rounded-md border border-brand-primary/60 bg-brand-bg/40 p-3 flex flex-col gap-2 min-h-[108px]"
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} className="text-brand-accent shrink-0" />
                <span className="text-xs font-medium text-brand-text truncate">{row.label}</span>
              </div>
              <p className="help-text leading-snug">{row.description}</p>
              {loading ? (
                <SkeletonText width={64} className="h-5 mt-auto" />
              ) : (
                <div className="mt-auto">
                  <div className="card-metric text-brand-text">{row.totalUses.toLocaleString()}</div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                    <span className="help-text">{row.percentage}% Of AI Calls</span>
                    {row.uniqueUsers > 0 && (
                      <span className="help-text">{row.uniqueUsers} Users</span>
                    )}
                    {row.avgDurationMs > 0 && (
                      <span className="help-text">Avg {formatDuration(row.avgDurationMs)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
