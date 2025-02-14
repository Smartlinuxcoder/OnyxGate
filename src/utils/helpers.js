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

const cleanUrl = (url) => {
    try {
        const urlObj = new URL(url);
        urlObj.search = '';
        urlObj.hash = '';
        return urlObj.toString();
    } catch (e) {
        console.error('URL cleaning error:', e);
        return url;
    }
};

const deleteCookies = async (url) => {
    try {
        const domain = new URL(url).hostname;
        const cookies = await chrome.cookies.getAll({ domain });
        
        const deletionPromises = cookies.map(cookie => {
            const protocol = cookie.secure ? 'https:' : 'http:';
            const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
            
            return chrome.cookies.remove({
                url: cookieUrl,
                name: cookie.name,
                storeId: cookie.storeId
            });
        });

        await Promise.all(deletionPromises);
        return cookies.length;
    } catch (e) {
        console.error('Cookie deletion error:', e);
        throw e;
    }
};

const getUserAgentSetting = async () => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getUserAgent' }, (response) => {
            resolve(response.userAgent);
        });
    });
};

const setUserAgentSetting = async (userAgent) => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
            action: 'setUserAgent', 
            userAgent: userAgent
        }, (response) => {
            resolve(response.success);
        });
    });
};

export { colors, userAgents, cleanUrl, deleteCookies, getUserAgentSetting, setUserAgentSetting };
