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
      timestamp: e.parameter.timestamp,
      tags: e.parameter.tags ? e.parameter.tags.split(',') : [],
      sheetId: e.parameter.sheetId || 'default'
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

// Function to create headers in the sheet
function createHeaders(sheet) {
  // Ensure we have a valid sheet
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getActiveSheet();
  }
  
  // Set headers if they don't exist
  if (sheet.getRange("A1").getValue() === "") {
    sheet.getRange("A1:E1").setValues([["Text", "URL", "Title", "Timestamp", "Tags"]]);
    sheet.getRange("A1:E1").setFontWeight("bold");
    
    // Set column widths
    sheet.setColumnWidth(1, 400); // Text column
    sheet.setColumnWidth(2, 200); // URL column
    sheet.setColumnWidth(3, 200); // Title column
    sheet.setColumnWidth(4, 150); // Timestamp column
    sheet.setColumnWidth(5, 150); // Tags column
    
    // Freeze the header row
    sheet.setFrozenRows(1);
  }
}

// Common function to process data and append to sheet
function processData(data) {
  try {
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create the target sheet
    let sheet;
    if (data.sheetId && data.sheetId !== 'default') {
      // Try to get existing sheet
      sheet = ss.getSheetByName(data.sheetId);
      
      // If sheet doesn't exist, create it
      if (!sheet) {
        sheet = ss.insertSheet(data.sheetId);
      }
    } else {
      // Use default sheet
      sheet = ss.getActiveSheet();
    }
    
    // Ensure headers exist
    createHeaders(sheet);
    
    // Format tags as comma-separated string
    const tagsString = Array.isArray(data.tags) ? data.tags.join(', ') : '';
    
    // Prepare the row data
    const rowData = [
      data.selectedText,  // Text column
      data.pageUrl,       // URL column
      data.pageTitle,     // Title column
      data.timestamp,     // Timestamp column
      tagsString          // Tags column
    ];
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    // Apply conditional formatting for tags
    const lastRow = sheet.getLastRow();
    const tagsCell = sheet.getRange(lastRow, 5); // Column E for tags
    
    // Create a filter for the sheet if it doesn't exist
    if (!sheet.getFilter()) {
      const range = sheet.getRange(1, 1, lastRow, 5);
      const filter = range.createFilter();
    }
    
    // Return success response
    return {
      'status': 'success',
      'message': 'Data successfully appended to sheet'
    };
  } catch (error) {
    return handleError(error);
  }
}

// Common function to handle errors
function handleError(error) {
  return {
    'status': 'error',
    'message': error.toString()
  };
} 