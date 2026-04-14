import { convertHtml } from './convert.mjs';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'convert') return;

  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        sendResponse({ error: 'No active tab' });
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          html: document.documentElement.outerHTML,
          url: document.URL,
        }),
      });

      const { html, url } = results[0].result;
      const markdown = convertHtml(html, url);
      sendResponse({ markdown, url });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();

  return true;
});
