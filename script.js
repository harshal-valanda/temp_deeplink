// Platform detection function
function detectPlatform(userAgent) {
  const ua = userAgent.toLowerCase();
  
  if (/android/.test(ua)) {
    return 'android';
  } 
  else if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  else {
    return 'web';
  }
}

// Deep links configuration
const DEEP_LINKS = {
  android: {
    scheme: window.ENV.ANDROID_CONFIG.SCHEME,
    fallback: window.ENV.ANDROID_CONFIG.PLAY_STORE_URL,
  },
  ios: {
    scheme: window.ENV.IOS_CONFIG.SCHEME,
    fallback: window.ENV.IOS_CONFIG.APP_STORE_URL,
  },
  web: {
    redirect: window.ENV.WEB_CONFIG.REDIRECT_URL,
  }
};

/** True if value is a non-empty string (after trim). */
function isMobileConfigSet(value) {
  return typeof value === 'string' && value.trim() !== '' && value.trim() !== '-';
}

/** Android: need scheme, package, and Play Store URL to attempt app + store fallback. */
function isAndroidNativeFlowConfigured() {
  const c = window.ENV.ANDROID_CONFIG;
  return (
    isMobileConfigSet(c.SCHEME) &&
    isMobileConfigSet(c.PACKAGE_NAME) &&
    isMobileConfigSet(c.PLAY_STORE_URL)
  );
}

/** iOS: need custom scheme and App Store URL for app + store fallback. */
function isIosNativeFlowConfigured() {
  const c = window.ENV.IOS_CONFIG;
  return isMobileConfigSet(c.SCHEME) && isMobileConfigSet(c.APP_STORE_URL);
}

function redirectToWebWithParams(queryParams) {
  const webRedirectUrl = new URL(DEEP_LINKS.web.redirect);
  queryParams.forEach((value, key) => {
    webRedirectUrl.searchParams.append(key, value);
  });
  window.location.href = webRedirectUrl.toString();
}

// Get all supported parameters from URL
function getAllSupportedParams() {
  const params = new URLSearchParams();
  const urlParams = new URLSearchParams(window.location.search);
  
  REFERRAL_CONFIG.supportedParams.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      params.append(param, value);
    }
  });
  return params;
}

// Copy current URL to clipboard
async function copyCurrentUrlToClipboard() {
  const currentUrl = window.location.href;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(currentUrl);
      const copiedText = await navigator.clipboard.readText();
      if (copiedText === currentUrl) {
        return true;
      }
    }
  } catch (err) {
    console.error('Clipboard API failed:', err);
  }
  
  try {
    const textArea = document.createElement('textarea');
    textArea.value = currentUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    } else {
      console.error('execCommand copy returned false');
      return false;
    }
  } catch (err) {
    console.error('All copy methods failed:', err);
    return false;
  }
}

// Handle open app button click
async function handleOpenClick() {
  // Copy URL immediately when button is clicked
  const copied = await copyCurrentUrlToClipboard();
  if (copied) {
    console.log('link copied to clipboard!');
  } else {
    console.log('Failed to copy link. Please copy manually: ' + window.location.href);
  }

  const detectedPlatform = detectPlatform(navigator.userAgent);
  const queryParams = getAllSupportedParams();

  if (detectedPlatform === 'android' && isAndroidNativeFlowConfigured()) {
    const intentUrl = generateAndroidIntentUrl(queryParams);

    // Try to open the app via intent URL
    window.location.href = intentUrl;

    // Fallback to Play Store if app not installed
    setTimeout(() => {
      window.location.href = window.ENV.ANDROID_CONFIG.PLAY_STORE_URL;
    }, REFERRAL_CONFIG.timeouts.deepLinkAttempt);

  } else if (detectedPlatform === 'ios' && isIosNativeFlowConfigured()) {
    const deepLink = generateDeepLinkUrl('ios', queryParams);
    
    // Try to open the app
    window.location.href = deepLink;

    // Fallback to App Store after timeout
    setTimeout(() => {
      window.location.href = DEEP_LINKS.ios.fallback;
    }, REFERRAL_CONFIG.timeouts.deepLinkAttempt);

  } else {
    // Web desktop, or mobile when native config is incomplete — same web redirect
    redirectToWebWithParams(queryParams);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const openAppBtn = document.getElementById('openAppBtn');
  
  if (openAppBtn) {
    openAppBtn.addEventListener('click', handleOpenClick);
  }
});
