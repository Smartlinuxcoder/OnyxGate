const userAgents = {
    chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ currentUserAgent: 'default' });
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1]
    });
});

async function updateUserAgentRule(userAgent) {
    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        });

        if (userAgent === 'default') return;

        await chrome.declarativeNetRequest.updateDynamicRules({
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
    } catch (error) {
        console.error('Error updating user agent rule:', error);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setUserAgent') {
        chrome.storage.local.set({ currentUserAgent: message.userAgent }, async () => {
            await updateUserAgentRule(message.userAgent);
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (message.action === 'getUserAgent') {
        chrome.storage.local.get('currentUserAgent', (data) => {
            sendResponse({ userAgent: data.currentUserAgent || 'default' });
        });
        return true;
    }
});