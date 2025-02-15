import { browserActions } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Status management
    //TODO this shi JANKY+Bad ui :pray: 
    const status = document.getElementById('status');
    const showStatus = (message, type = 'info') => {
        status.textContent = message;
        status.className = `status-banner ${type}`;
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 3000);
    };
    // hehe I am going insane, why can't I seem to be able to use a js framework
    const sections = ['links', 'cookies', 'identity'];
    const navButtons = document.querySelectorAll('.sections-nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => {
                document.getElementById(`${section}-section`).classList.add('hidden');
            });

            button.classList.add('active');
            const sectionToShow = button.getAttribute('data-section');
            const sectionElement = document.getElementById(`${sectionToShow}-section`);
            if (sectionElement) {
                sectionElement.classList.remove('hidden');
            }
        });
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname;
    document.getElementById('currentDomain').textContent = domain;
    document.getElementById('currentUrl').textContent = tab.url;

    document.getElementById('fastAnonymize').addEventListener('click', async () => {
        try {
            const agents = ['chrome', 'firefox', 'safari', 'edge'];
            const randomAgent = agents[Math.floor(Math.random() * agents.length)];
            
            document.getElementById('blockThirdParty').checked = true;
            document.getElementById('autoCleanUrls').checked = true;
            
            document.getElementById('userAgent').value = randomAgent;
            await chrome.runtime.sendMessage({ 
                action: 'setUserAgent',
                userAgent: randomAgent 
            });

            await chrome.runtime.sendMessage({
                action: 'toggleUrlCleaning',
                enabled: true
            });

            showStatus('Privacy shields activated! 🛡️', 'success');
            chrome.tabs.reload(tab.id);
        } catch (error) {
            showStatus('Failed to anonymize', 'error');
        }
    });

    // Cookie Controls
    document.getElementById('clearSiteCookies').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const domain = new URL(tab.url).hostname;
            
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'clearCookies',
                    domain: domain
                }, resolve);
            });

            if (response.success) {
                showStatus(`Deleted ${response.count} cookies`, 'success');
                chrome.tabs.reload(tab.id);
            } else {
                throw new Error(response.error || 'Failed to delete cookies');
            }
        } catch (error) {
            console.error('Cookie deletion error:', error);
            showStatus('Failed to delete cookies', 'error');
        }
    });

    // User Agent Controls
    document.getElementById('userAgent').addEventListener('change', async () => {
        try {
            const select = document.getElementById('userAgent');
            await chrome.runtime.sendMessage({ 
                action: 'setUserAgent',
                userAgent: select.value 
            });
            showStatus(`User agent changed to ${select.options[select.selectedIndex].text}`);
            chrome.tabs.reload(tab.id);
        } catch (error) {
            showStatus('Failed to change user agent', 'error');
        }
    });

    const autoCleanToggle = document.getElementById('autoCleanUrls');
    
    const { enabled } = await chrome.runtime.sendMessage({ action: 'getUrlCleaningStatus' });
    autoCleanToggle.checked = enabled;

    autoCleanToggle.addEventListener('change', async () => {
        try {
            await chrome.runtime.sendMessage({ 
                action: 'toggleUrlCleaning',
                enabled: autoCleanToggle.checked 
            });
            showStatus(`Auto URL cleaning ${autoCleanToggle.checked ? 'enabled' : 'disabled'}`, 'success');
        } catch (error) {
            showStatus('Failed to toggle URL cleaning', 'error');
        }
    });

    document.getElementById('cleanCurrentUrl').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await browserActions.cleanUrl(tab.url, true);

            if (response.success && response.url !== tab.url) {
                await chrome.tabs.update(tab.id, { url: response.url });
                showStatus('URL cleaned successfully', 'success');
                
                await new Promise(resolve => {
                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === tab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    });
                });

                const updatedTab = await chrome.tabs.get(tab.id);
                document.getElementById('currentUrl').textContent = updatedTab.url;
            } else {
                showStatus('URL is already clean', 'info');
            }
        } catch (error) {
            console.error('URL cleaning error:', error);
            showStatus('Failed to clean URL', 'error');
        }
    });

    try {
        const { userAgent } = await chrome.runtime.sendMessage({ action: 'getUserAgent' });
        if (userAgent) {
            document.getElementById('userAgent').value = userAgent;
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
});