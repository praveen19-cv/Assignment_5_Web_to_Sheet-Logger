# Web-to-Sheet Logger Chrome Extension

A Chrome extension that allows users to highlight text on any webpage and save it to a Google Sheet along with metadata.

## Current Implementation (Day 2)

### Features Implemented
- Text selection detection
- Floating "Save to Sheet" button appears near selected text
- Selected text is logged in console
- Basic UI for saving highlights

### Setup Instructions
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### Testing the Extension
1. After loading the extension, you should see the extension icon in your Chrome toolbar
2. Open any webpage and select some text
3. A green "Save to Sheet" button will appear near your selection
4. Check the browser console (F12) to see:
   - Selected text being logged
   - "Saving text" message when clicking the button

### Project Structure
- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Text selection and floating button logic
- `styles.css` - Styling for the floating button

### Next Steps
- Implement Google Sheets integration
- Add metadata collection (timestamp, URL)
- Enhance UI/UX 