export interface AnalyticsEventParams {
  [key: string]: any;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

class AnalyticsService {
  private initialized = false;

  public init() {
    if (this.initialized) return;

    const gaId = import.meta.env.VITE_GA_ID;
    if (gaId && gaId !== 'G-XXXXXX') {
      try {
        // Dynamically create and inject the GA tag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        
        window.gtag('js', new Date());
        window.gtag('config', gaId, {
          send_page_view: false // We trigger page views manually on route transitions
        });
        
        console.log(`[AnalyticsService] Initialized Google Analytics with ID: ${gaId}`);
      } catch (error) {
        console.error('[AnalyticsService] Failed to load Google Analytics script:', error);
      }
    } else {
      console.log('[AnalyticsService] Google Analytics ID is missing or placeholder. Running in mock mode.');
    }

    this.initialized = true;
  }

  public trackPageView(pageName: string, path: string) {
    if (!this.initialized) this.init();

    const gaId = import.meta.env.VITE_GA_ID;
    if (gaId && gaId !== 'G-XXXXXX' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: path
      });
    }

    console.log(`[Analytics] Page View: ${pageName} (${path})`);
  }

  public trackEvent(eventName: string, params?: AnalyticsEventParams) {
    if (!this.initialized) this.init();

    const gaId = import.meta.env.VITE_GA_ID;
    if (gaId && gaId !== 'G-XXXXXX' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }

    console.log(`[Analytics] Event: ${eventName}`, params || {});
  }
}

export const analytics = new AnalyticsService();
