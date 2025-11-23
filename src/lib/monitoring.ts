/**
 * Simple monitoring utility to track application errors and performance
 */

// Track application errors
export const trackError = (error: Error, context?: Record<string, any>): void => {
  console.error('[APP ERROR]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // In a production environment, you would send this to a monitoring service
  // Example: sendToMonitoringService({ error, context });
};

// Track page load performance
export const trackPageLoad = (pageName: string): void => {
  if (window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    console.info('[PAGE LOAD]', {
      page: pageName,
      loadTimeMs: pageLoadTime,
      timestamp: new Date().toISOString(),
    });
  }
};

// Monitor Supabase connection status
export const monitorSupabaseConnection = (isConnected: boolean): void => {
  console.info('[SUPABASE CONNECTION]', {
    status: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};

// Initialize monitoring
export const initMonitoring = (): void => {
  // Set up global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error, { source: 'window.onerror' });
  });
  
  // Track initial page load
  window.addEventListener('load', () => {
    trackPageLoad(window.location.pathname);
  });
};