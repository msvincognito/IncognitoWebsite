(function initializeAnalyticsConsent(window, document) {
  'use strict';

  if (window.__incognitoMatomoConsentController) return;
  window.__incognitoMatomoConsentController = true;

  var storageKey = 'incognito.analytics-consent.v1';
  var accepted = 'accepted';
  var declined = 'declined';
  var trackerOrigin = 'https://analytics.msvincognito.nl/';

  function readDecision() {
    try {
      var value = window.localStorage.getItem(storageKey);
      return value === accepted || value === declined ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function writeDecision(value) {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch (_error) {
      // The choice still applies to this document when storage is unavailable.
    }
  }

  function initializeMatomo() {
    var queue = window._paq = window._paq || [];
    if (window.__incognitoMatomoInitialized) return;

    window.__incognitoMatomoInitialized = true;
    queue.push(['requireConsent']);
    queue.push(['disableCookies']);
    queue.push(['setConsentGiven']);
    queue.push(['setTrackerUrl', trackerOrigin + 'matomo.php']);
    queue.push(['setSiteId', '1']);
    queue.push(['trackPageView']);
    queue.push(['enableLinkTracking']);

    var tracker = document.createElement('script');
    tracker.id = 'incognito-matomo-script';
    tracker.async = true;
    tracker.src = trackerOrigin + 'matomo.js';
    document.head.appendChild(tracker);
  }

  function createElement(tagName, options) {
    var element = document.createElement(tagName);
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.text) element.textContent = options.text;
    return element;
  }

  var banner = createElement('section', {
    id: 'incognito-analytics-consent',
    className: 'incognito-consent',
  });
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-labelledby', 'incognito-analytics-consent-title');
  banner.setAttribute('aria-describedby', 'incognito-analytics-consent-description');

  var copy = createElement('div', { className: 'incognito-consent-copy' });
  copy.appendChild(createElement('p', {
    className: 'incognito-consent-eyebrow',
    text: 'Your privacy',
  }));
  copy.appendChild(createElement('h2', {
    id: 'incognito-analytics-consent-title',
    text: 'Privacy-friendly analytics',
  }));
  copy.appendChild(createElement('p', {
    id: 'incognito-analytics-consent-description',
    text: 'We use cookieless Matomo analytics to understand how this website is used. Nothing is sent unless you allow it, and you can change your choice at any time.',
  }));
  var privacyLink = createElement('a', { text: 'Read our privacy policy' });
  privacyLink.href = '/privacy-policy';
  copy.appendChild(privacyLink);

  var actions = createElement('div', { className: 'incognito-consent-actions' });
  var acceptButton = createElement('button', {
    id: 'incognito-analytics-accept',
    className: 'incognito-consent-action incognito-consent-action--primary',
    text: 'Allow analytics',
  });
  acceptButton.type = 'button';
  var declineButton = createElement('button', {
    id: 'incognito-analytics-decline',
    className: 'incognito-consent-action incognito-consent-action--secondary',
    text: 'Decline',
  });
  declineButton.type = 'button';
  actions.appendChild(acceptButton);
  actions.appendChild(declineButton);

  var settingsButton = createElement('button', {
    id: 'incognito-privacy-settings',
    text: 'Privacy settings',
  });
  settingsButton.type = 'button';
  settingsButton.hidden = true;

  function showBanner(moveFocus) {
    banner.hidden = false;
    settingsButton.hidden = true;
    if (moveFocus) acceptButton.focus();
  }

  function hideBanner(restoreFocus) {
    banner.hidden = true;
    settingsButton.hidden = false;
    if (restoreFocus) settingsButton.focus();
  }

  acceptButton.addEventListener('click', function acceptAnalytics() {
    if (banner.hidden) return;
    writeDecision(accepted);
    try {
      if (window.__incognitoMatomoInitialized) {
        window._paq.push(['setConsentGiven']);
      } else {
        initializeMatomo();
      }
    } finally {
      hideBanner(true);
    }
  });

  declineButton.addEventListener('click', function declineAnalytics() {
    if (banner.hidden) return;
    writeDecision(declined);
    if (window._paq) {
      window._paq.push(['forgetConsentGiven']);
      window._paq.push(['deleteCookies']);
    }
    hideBanner(true);
  });

  settingsButton.addEventListener('click', function openPrivacySettings() {
    if (settingsButton.hidden) return;
    showBanner(true);
  });

  banner.appendChild(copy);
  banner.appendChild(actions);
  document.body.appendChild(banner);
  document.body.appendChild(settingsButton);

  var decision = readDecision();
  if (decision === accepted) {
    hideBanner(false);
    try {
      initializeMatomo();
    } catch (_error) {
      // Analytics failure must not affect the website or consent controls.
    }
  } else if (decision === declined) {
    hideBanner(false);
  } else {
    showBanner(false);
  }
})(window, document);
