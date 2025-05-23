// Google Apps Script to handle webhook requests and append data to Google Sheet
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const result = processData(data);
    
    // Return JSON response with CORS headers
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return handleError(error);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  try {
    // Get parameters from URL
    const data = {
      selectedText: e.parameter.selectedText,
      pageUrl: e.parameter.pageUrl,
      pageTitle: e.parameter.pageTitle,
      timestamp: e.parameter.timestamp
    };
    const result = processData(data);
    
    // Return JSON response
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return handleError(error);
  }
}

// Handle OPTIONS requests for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

// Common function to process data and append to sheet
function processData(data) {
  // Get the active spreadsheet and sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // Prepare the row data
  const rowData = [
    data.selectedText,  // Text column
    data.pageUrl,       // URL column
    data.pageTitle,     // Title column
    data.timestamp      // Timestamp column
  ];
  
  // Append the row to the sheet
  sheet.appendRow(rowData);
  
  // Return success response
  return {
    'status': 'success',
    'message': 'Data successfully appended to sheet'
  };
}

// Common function to handle errors
function handleError(error) {
  return {
    'status': 'error',
    'message': error.toString()
  };
}

// Function to create headers in the sheet
function createHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // Set headers if they don't exist
  if (sheet.getRange("A1").getValue() === "") {
    sheet.getRange("A1:D1").setValues([["Text", "URL", "Title", "Timestamp"]]);
    sheet.getRange("A1:D1").setFontWeight("bold");
  }
} 