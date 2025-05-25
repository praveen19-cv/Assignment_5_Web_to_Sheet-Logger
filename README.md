# Web-to-Sheet Logger Chrome Extension

A Chrome extension that allows users to highlight text on any webpage and save it to a Google Sheet along with metadata. The extension supports multiple text selections and provides a seamless experience for logging web content.

## Features

- 🔍 Text selection detection with floating save button
- 📝 Multiple text selection support
- 📊 Automatic logging to Google Sheet
- 🕒 Timestamp and URL tracking
- 🎯 Context menu integration
- ⚡ Real-time feedback and error handling
- 🔄 Connection state management with retry mechanism

## Permissions Used

The extension requires the following permissions:
- `activeTab`: To access the current tab's content
- `contextMenus`: To create the right-click context menu
- `storage`: To store user preferences
- `scripting`: To inject content scripts
- `tabs`: To interact with browser tabs

## Setup Instructions

### 1. Chrome Extension Setup
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### 2. Google Apps Script Setup
1. Create a new Google Sheet
2. Go to Extensions > Apps Script
3. Copy the contents of `Code.gs` into the script editor
4. Deploy as a web app:
   - Click "Deploy" > "New deployment"
   - Choose "Web app"
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
5. Copy the deployment URL
6. Update the `SHEET_URL` in `Code.gs` with your sheet's URL

### 3. Extension Configuration
1. Open the extension popup
2. Enter your Google Sheet URL
3. Click "Save" to store the configuration

## Usage

1. Select text on any webpage
2. Either:
   - Click the floating "Save to Sheet" button, or
   - Right-click and select "Save selection to Sheet"
3. The text will be saved to your Google Sheet with:
   - Selected text
   - Source URL
   - Timestamp
   - Page title

## Project Structure

- `manifest.json` - Extension configuration and permissions
- `popup.html/js` - Extension popup interface
- `content.js` - Text selection and floating button logic
- `background.js` - Background processes and context menu
- `styles.css` - Styling for UI elements
- `Code.gs` - Google Apps Script for sheet integration

## Known Limitations

1. **Sheet Access**:
   - Requires manual setup of Google Apps Script
   - Sheet must be publicly accessible
   - Maximum 50,000 rows per sheet

2. **Selection**:
   - Maximum selection length: 50,000 characters
   - Some websites may block text selection
   - Dynamic content may affect selection accuracy

3. **Performance**:
   - Initial load may take 1-2 seconds
   - Multiple selections may have slight delay
   - Sheet updates may take 1-3 seconds

4. **Browser Support**:
   - Currently only supports Chrome
   - Requires Chrome version 88 or higher

## Troubleshooting

1. **Extension Not Working**:
   - Check if Developer mode is enabled
   - Verify all permissions are granted
   - Reload the extension

2. **Save Failed**:
   - Check internet connection
   - Verify sheet URL is correct
   - Ensure sheet has write permissions

3. **Button Not Appearing**:
   - Try selecting text again
   - Check if website blocks selection
   - Reload the page

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 