document.addEventListener('DOMContentLoaded', async function () {
    const statusDiv = document.getElementById('status');

    const showStatus = (message, isError = false) => {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : 'success';
        setTimeout(() => statusDiv.textContent = '', 3000);
    };

    document.getElementById('deleteCookies')?.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const domain = new URL(tab.url).hostname;
            const cookies = await chrome.cookies.getAll({ domain });

            await Promise.all(cookies.map(cookie =>
                chrome.cookies.remove({
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                })
            ));

            showStatus(`Deleted ${cookies.length} cookies`);
        } catch (error) {
            console.error('Cookie deletion error:', error);
            showStatus('Failed to delete cookies', true);
        }
    });

    document.getElementById('cleanUrl')?.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = new URL(tab.url);
            url.search = '';
            url.hash = '';
            const cleanedUrl = url.toString();

            if (cleanedUrl !== tab.url) {
                await chrome.tabs.update(tab.id, { url: cleanedUrl });
                showStatus('URL cleaned successfully');
            } else {
                showStatus('URL is already clean');
            }
        } catch (error) {
            console.error('URL cleaning error:', error);
            showStatus('Failed to clean URL', true);
        }
    });

    document.getElementById('changeUserAgent')?.addEventListener('click', async () => {
        try {
            const select = document.getElementById('userAgent');
            const selectedAgent = select.value;

            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'setUserAgent',
                    userAgent: selectedAgent
                }, resolve);
            });

            if (response.success) {
                showStatus(`User agent changed to ${select.options[select.selectedIndex].text}`);
                if (selectedAgent !== 'default') {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab) await chrome.tabs.reload(tab.id);
                }
            } else {
                throw new Error(response.error || 'Failed to change user agent');
            }
        } catch (error) {
            console.error('User agent change error:', error);
            showStatus(error.message || 'Failed to change user agent', true);
        }
    });

    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getUserAgent' }, resolve);
        });

        const select = document.getElementById('userAgent');
        if (select && response.userAgent) {
            select.value = response.userAgent;
        }
    } catch (error) {
        console.error('User agent initialization error:', error);
        showStatus('Failed to initialize user agent selector', true);
    }
});