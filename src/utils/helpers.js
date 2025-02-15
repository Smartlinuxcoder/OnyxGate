// Catppuccin Mocha :3
export const colors = {
    base: '#1e1e2e',
    surface0: '#313244',
    surface1: '#45475a',
    text: '#cdd6f4',
    subtext0: '#a6adc8',
    green: '#a6e3a1',
    red: '#f38ba8',
    lavender: '#b4befe',
    blue: '#89b4fa'
};

// Gotta mention chatgpt for providing the user agent strings
export const userAgents = {
    chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
};

export const trackingParams = [
    'igsh', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'ocid', 'igshid', '_hsenc', '_hsmi', '_ga', '_gl', 
    'hsCtaTracking', '_openstat', '_ga_', 'mc_cid', 'mc_eid', 'ref', 'referral', 
    'source', 'fb_ref', 'fb_source', 'campaign_id', 'campaign_name', 'adset_id', 
    'ad_id', 'placement', 'ig_mid', 'ig_rid', 'ig_es', 'ig_share_tool', 'igshid_ref'
];

export const messageHandler = (action, data) => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action, ...data }, resolve);
    });
};

export const browserActions = {
    async getUserAgent() {
        const response = await messageHandler('getUserAgent');
        return response.userAgent;
    },

    async setUserAgent(userAgent) {
        const response = await messageHandler('setUserAgent', { userAgent });
        return response.success;
    },

    async clearCookies(domain) {
        const response = await messageHandler('clearCookies', { domain });
        return response;
    },

    async cleanUrl(url, aggressive = false) {
        const response = await messageHandler('cleanUrl', { url, aggressive });
        return response;
    }
};
