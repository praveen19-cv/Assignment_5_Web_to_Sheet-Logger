// Track connection state
let connectionState = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 3
};

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'saveToSheet',
      title: 'Save selection to Sheet',
      contexts: ['selection']
    });
    console.log('Context menu created successfully');
  } catch (error) {
    console.error('Failed to create context menu:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveToSheet') {
    try {
      // Check if tab is valid
      if (!tab || !tab.id) {
        throw new Error('Invalid tab');
      }

      // Send message to content script with retry mechanism
      await sendMessageWithRetry(tab.id, {
        action: 'saveSelection',
        text: info.selectionText
      });

      // Reset connection state on success
      connectionState.isConnected = true;
      connectionState.retryCount = 0;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error notification to user
      chrome.tabs.sendMessage(tab.id, {
        action: 'showError',
        error: 'Failed to connect to the extension. Please try again.'
      });
    }
  }
});

// Helper function to send message with retry
async function sendMessageWithRetry(tabId, message) {
  return new Promise((resolve, reject) => {
    const sendMessage = () => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          if (connectionState.retryCount < connectionState.maxRetries) {
            connectionState.retryCount++;
            console.log(`Retrying connection (${connectionState.retryCount}/${connectionState.maxRetries})...`);
            setTimeout(sendMessage, 1000 * connectionState.retryCount); // Exponential backoff
          } else {
            reject(new Error('Max retries exceeded'));
          }
        } else {
          resolve(response);
        }
      });
    };

    sendMessage();
  });
}

// Listen for connection status updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateConnectionStatus') {
    connectionState.isConnected = message.isConnected;
    if (message.isConnected) {
      connectionState.retryCount = 0;
    }
  }
  sendResponse({ success: true });
}); 