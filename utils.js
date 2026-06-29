
// Configuration for the referral app
const REFERRAL_CONFIG = {
    timeouts: {
      deepLinkAttempt: 3000,
      initialization: 500,
    },
    
    supportedParams: [
      'code',
      'type',
      'profile',
      'post',
      'post_type',
    ],
  };
  
  // Generate Android Intent URL
  function generateAndroidIntentUrl(params) {
    let queryString = params.toString();
    // Encode & so Android Intent doesn’t cut the string early
    queryString = queryString.replace(/&/g, '&');
  
    const queryParam = queryString ? `?${queryString}` : '';
    
    // const baseIntent = `intent://open${queryParam}#Intent;scheme=${REFERRAL_CONFIG.android.scheme};package=${REFERRAL_CONFIG.android.packageName};end`;
    const baseIntent = `${window.ENV.ANDROID_CONFIG.SCHEME}://open/${queryParam}`;
    return baseIntent;
  }
  
  // Generate Deep Link URL
  function generateDeepLinkUrl(platform, params) {
    if (platform === 'android') {
      return generateAndroidIntentUrl(params);
    } else if (platform === 'ios') {
      const queryString = params.toString();
      const queryParam = queryString ? `?${queryString}` : '';
      return `${window.ENV.IOS_CONFIG.SCHEME}://${queryParam}`;
    } else {
      return `${window.ENV.WEB_CONFIG.REDIRECT_URL}?${params.toString()}`;
    }
  }
  