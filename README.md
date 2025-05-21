# Web-to-Sheet Logger Chrome Extension

A Chrome extension that allows users to highlight text on any webpage and save it to a Google Sheet along with metadata.

## Day 1 Setup Instructions

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Testing the Extension (Day 1)

1. After loading the extension, you should see the extension icon (generic puzzle piece) in your Chrome toolbar
2. Click the icon to see the popup with the welcome message
3. Open any webpage and select some text
4. Check the browser console (F12) to verify:
   - "Hello from Web-to-Sheet Logger content script!" message is visible
   - Selected text is logged in the console when you highlight text

## Project Structure (Day 1)

- `manifest.json` - Extension configuration (Manifest V3)
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Content script for text selection
- `styles.css` - Styling for the extension

## Next Steps (Day 2)
- Add floating "Save to Sheet" button
- Implement text selection handling
- Add basic UI for saving highlights 