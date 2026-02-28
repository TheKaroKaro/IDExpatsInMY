// Turnstile helper functions
const Turnstile = {
  // Render Turnstile widget
  render(elementId, callback) {
    if (typeof turnstile === 'undefined') {
      console.error('Turnstile not loaded');
      return null;
    }
    
    return turnstile.render(`#${elementId}`, {
      sitekey: TURNSTILE_CONFIG.siteKey,
      callback: callback,
      'error-callback': (error) => {
        console.error('Turnstile error:', error);
      }
    });
  },
  
  // Reset Turnstile widget
  reset(widgetId) {
    if (typeof turnstile !== 'undefined') {
      turnstile.reset(widgetId);
    }
  },
  
  // Get response token
  getResponse(widgetId) {
    if (typeof turnstile !== 'undefined') {
      return turnstile.getResponse(widgetId);
    }
    return null;
  }
};