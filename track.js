// Lightweight first-party analytics beacon
(function () {
    function send() {
        try {
            navigator.sendBeacon
                ? navigator.sendBeacon('/api/track', new Blob([JSON.stringify(d)], { type: 'application/json' }))
                : fetch('/api/track', { method: 'POST', body: JSON.stringify(d), keepalive: true });
        } catch (e) { /* never break the page */ }
    }
    var d = {
        path: location.pathname,
        referrer: document.referrer || '',
        lang: navigator.language || '',
        screen: window.innerWidth + 'x' + window.innerHeight,
    };
    var q = new URLSearchParams(location.search);
    ['source', 'medium', 'campaign'].forEach(function (k) {
        var v = q.get('utm_' + k);
        if (v) d['utm_' + k] = v.slice(0, 60);
    });
    if (document.visibilityState === 'prerender') {
        document.addEventListener('visibilitychange', function once () {
            document.removeEventListener('visibilitychange', once);
            if (document.visibilityState === 'visible') send();
        });
    } else {
        send();
    }
})();
