import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, AnalyticsEventParams } from '../services/AnalyticsService';

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Automatically track page views on route change
    analytics.trackPageView(document.title || 'Heroic Dashboard', location.pathname);
  }, [location]);

  return {
    trackEvent: (eventName: string, params?: AnalyticsEventParams) => {
      analytics.trackEvent(eventName, params);
    }
  };
}
