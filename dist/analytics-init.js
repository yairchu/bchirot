// Script integration supplied by Plausible; no package or build step required.
(() => {
  const { hostname, protocol } = window.location;
  if (!['http:', 'https:'].includes(protocol)
    || hostname === 'localhost' || hostname.endsWith('.localhost')
    || hostname === '[::1]' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) return;

  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  window.plausible.init = window.plausible.init || function (options) {
    window.plausible.o = options || {};
  };
  // Answer selections also update browser history. Count one pageview per load,
  // then measure quiz progress explicitly instead of counting history mutations.
  window.plausible.init({ autoCapturePageviews: false });
  window.plausible('pageview');

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://plausible.io/js/pa-sQ3MAbMALwg4k9gDtOIWq.js';
  document.head.append(script);
})();
