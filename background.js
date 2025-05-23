// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToSheet',
    title: 'Save selection to Sheet',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveToSheet') {
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'saveSelection',
      text: info.selectionText
    });
  }
}); 