// Google Apps Script to handle webhook requests and append data to Google Sheet
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    return processData(data);
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
    return processData(data);
  } catch (error) {
    return handleError(error);
  }
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
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'success',
    'message': 'Data successfully appended to sheet'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Common function to handle errors
function handleError(error) {
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'error',
    'message': error.toString()
  })).setMimeType(ContentService.MimeType.JSON);
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