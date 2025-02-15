const userAgents = {
    chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
};

const trackingParams = [
    'igsh', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'ocid', 'igshid', '_hsenc', '_hsmi', '_ga', '_gl', 
    'hsCtaTracking', '_openstat', '_ga_', 'mc_cid', 'mc_eid', 'ref', 'referral', 
    'source', 'fb_ref', 'fb_source', 'campaign_id', 'campaign_name', 'adset_id', 
    'ad_id', 'placement', 'ig_mid', 'ig_rid', 'ig_es', 'ig_share_tool', 'igshid_ref'
];

let autoCleanUrls = false;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ 
        currentUserAgent: 'default',
        autoCleanUrls: false 
    });
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1]
    });
});

async function updateUserAgentRule(userAgent) {
    if (userAgent === 'default') {
        return chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        });
    }

    return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: [{
            id: 1,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                requestHeaders: [{
                    header: 'User-Agent',
                    operation: 'set',
                    value: userAgents[userAgent]
                }]
            },
            condition: {
                urlFilter: '*',
                resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
            }
        }]
    });
}

function cleanUrl(url, aggressive = false) {
    try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const cleanParams = new URLSearchParams();

        for (const [key, value] of params.entries()) {
            const isTracking = trackingParams.some(param => 
                key.toLowerCase().includes(param.toLowerCase())
            );
            
            const isEssential = ['id', 'page', 'lang', 'v'].includes(key);
            if (!isTracking || (!aggressive && isEssential)) {
                cleanParams.append(key, value);
            }
        }

        let path = urlObj.pathname;
        if (path.includes('/reel/') || path.includes('/p/')) {
            path = path.split('?')[0];
        }

        urlObj.search = cleanParams.toString() || '';
        urlObj.hash = '';

        return urlObj.toString();
    } catch {
        return url;
    }
}

chrome.webNavigation.onBeforeNavigate.addListener(async ({ frameId, url, tabId }) => {
    if (frameId === 0) {
        const { autoCleanUrls } = await chrome.storage.local.get('autoCleanUrls');
        if (autoCleanUrls) {
            const cleanedUrl = cleanUrl(url, true);
            if (cleanedUrl !== url) {
                await chrome.tabs.update(tabId, { url: cleanedUrl });
            }
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handlers = {
        setUserAgent: () => {
            chrome.storage.local.set({ currentUserAgent: message.userAgent }, async () => {
                await updateUserAgentRule(message.userAgent);
                sendResponse({ success: true });
            });
        },
        getUserAgent: () => {
            chrome.storage.local.get('currentUserAgent', (data) => {
                sendResponse({ userAgent: data.currentUserAgent || 'default' });
            });
        },
        toggleUrlCleaning: () => {
            chrome.storage.local.set({ autoCleanUrls: message.enabled }, () => {
                sendResponse({ success: true });
            });
        },
        getUrlCleaningStatus: () => {
            chrome.storage.local.get('autoCleanUrls', (data) => {
                sendResponse({ enabled: data.autoCleanUrls || false });
            });
        },
        cleanUrl: () => {
            const cleanedUrl = cleanUrl(message.url, message.aggressive || false);
            sendResponse({ success: true, url: cleanedUrl });
        },
        clearCookies: () => {
            chrome.cookies.getAll({ domain: message.domain }, async (cookies) => {
                try {
                    await Promise.all(cookies.map(cookie => {
                        const protocol = cookie.secure ? 'https:' : 'http:';
                        return chrome.cookies.remove({
                            url: `${protocol}//${cookie.domain}${cookie.path}`,
                            name: cookie.name,
                            storeId: cookie.storeId || null
                        });
                    }));
                    sendResponse({ success: true, count: cookies.length });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            });
        }
    };

    const handler = handlers[message.action];
    if (handler) {
        handler();
        return true;
    }
});