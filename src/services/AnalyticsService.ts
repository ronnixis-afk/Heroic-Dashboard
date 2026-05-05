export interface AnalyticsEventParams {
  [key: string]: any;
}

class AnalyticsService {
  private initialized = false;

  public init() {
    if (this.initialized) return;
    
    // Future integration point for Google Analytics:
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', 'G-XXXXXXXXXX');

    console.log('[AnalyticsService] Initialized');
    this.initialized = true;
  }

  public trackPageView(pageName: string, path: string) {
    if (!this.initialized) this.init();

    // Future integration point:
    // gtag('event', 'page_view', {
    //   page_title: pageName,
    //   page_location: path
    // });

    console.log(`[Analytics] Page View: ${pageName} (${path})`);
  }

  public trackEvent(eventName: string, params?: AnalyticsEventParams) {
    if (!this.initialized) this.init();

    // Future integration point:
    // gtag('event', eventName, params);

    console.log(`[Analytics] Event: ${eventName}`, params || {});
  }
}

export const analytics = new AnalyticsService();
