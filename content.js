const floatingButton = document.createElement('div');
floatingButton.className = 'save-to-sheet-button';
floatingButton.textContent = 'Save to Sheet';
floatingButton.style.cssText = `
    position: fixed;
    display: none;
    background: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    transition: opacity 0.2s;
    opacity: 0;
`;
document.body.appendChild(floatingButton);

// Track multiple selections
let selections = new Map(); // Map to store multiple selections

// Add a flag to track if a save is in progress
let isSaving = false;

// Debounce function to prevent rapid firing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to check if selection is valid
function isValidSelection(text) {
    return text && text.trim().length > 0 && text.length <= 50000; // Max 50k chars
}

// Function to generate unique ID for selection
function generateSelectionId() {
    return `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to position button
function positionButton(rect, scrollX, scrollY) {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate button dimensions
    const buttonWidth = floatingButton.offsetWidth;
    const buttonHeight = floatingButton.offsetHeight;
    
    // Calculate initial position
    let left = rect.left + scrollX;
    let top = rect.bottom + scrollY + 10;
    
    // Ensure button stays within viewport
    if (left + buttonWidth > viewportWidth + scrollX) {
        left = viewportWidth + scrollX - buttonWidth - 10;
    }
    if (top + buttonHeight > viewportHeight + scrollY) {
        top = rect.top + scrollY - buttonHeight - 10;
    }
    
    // Ensure minimum distance from edges
    left = Math.max(10, Math.min(left, viewportWidth + scrollX - buttonWidth - 10));
    top = Math.max(10, Math.min(top, viewportHeight + scrollY - buttonHeight - 10));
    
    floatingButton.style.left = `${left}px`;
    floatingButton.style.top = `${top}px`;

    // Update button text to show selection count
    floatingButton.textContent = selections.size > 1 
        ? `Save ${selections.size} Selections` 
        : 'Save to Sheet';
}

// Debounced selection handler
const handleSelection = debounce(function(e) {
    const selectedText = window.getSelection().toString().trim();
    
    if (isValidSelection(selectedText)) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Generate unique ID for this selection
        const selectionId = generateSelectionId();
        
        // Store selection with metadata
        selections.set(selectionId, {
            text: selectedText,
            timestamp: Date.now(),
            rect: rect
        });
        
        // Position and show button
        positionButton(rect, window.scrollX, window.scrollY);
        floatingButton.style.display = 'block';
        
        // Fade in
        requestAnimationFrame(() => {
            floatingButton.style.opacity = '1';
        });
    }
}, 100);

// Function to hide button with fade
function hideButton() {
    floatingButton.style.opacity = '0';
    setTimeout(() => {
        floatingButton.style.display = 'none';
        // Clear selections when hiding button
        selections.clear();
    }, 200);
}

// Event listeners
document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', handleSelection);

document.addEventListener('mousedown', function(e) {
    if (!floatingButton.contains(e.target)) {
        hideButton();
    }
});

// Hide button on scroll
let scrollTimeout;
window.addEventListener('scroll', function() {
    hideButton();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleSelection, 150);
});

// Hide button on resize
window.addEventListener('resize', function() {
    hideButton();
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleSelection, 150);
});

// Function to validate data before sending
function validateData(data) {
    const errors = [];
    
    // Validate selected text
    if (!data.selectedText || data.selectedText.trim().length === 0) {
        errors.push('Selected text cannot be empty');
    } else if (data.selectedText.length > 50000) {
        errors.push('Selected text is too long (max 50,000 characters)');
    }
    
    // Validate URL
    try {
        new URL(data.pageUrl);
    } catch (e) {
        errors.push('Invalid page URL');
    }
    
    // Validate title
    if (!data.pageTitle || data.pageTitle.trim().length === 0) {
        errors.push('Page title cannot be empty');
    }
    
    // Validate timestamp
    if (!data.timestamp || isNaN(new Date(data.timestamp).getTime())) {
        errors.push('Invalid timestamp');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveSelection') {
        // Create metadata object
        const metadata = {
            selectedText: message.text,
            pageTitle: document.title,
            pageUrl: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Show confirmation popup
        showConfirmationPopup(metadata);
    }
});

// Function to show confirmation popup
function showConfirmationPopup(metadata) {
    // Create and show confirmation popup
    const popup = document.createElement('div');
    
    // Create content based on number of selections
    let content = '';
    if (selections.size > 1) {
        content = `
            <h2>Confirm ${selections.size} Highlights</h2>
            <div class="selections-list">
                ${Array.from(selections.entries()).map(([id, selection], index) => `
                    <div class="selection-item">
                        <div class="selection-header">
                            <span class="selection-number">#${index + 1}</span>
                            <button class="remove-selection" data-id="${id}">×</button>
                        </div>
                        <div class="selection-text">${selection.text}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        content = `
            <h2>Confirm Highlight</h2>
            <div class="metadata-item">
                <div class="metadata-label">Selected Text:</div>
                <div class="metadata-value">${metadata.selectedText}</div>
            </div>
        `;
    }
    
    // Add sheet selector
    content += `
        <div class="metadata-item">
            <div class="metadata-label">Select Sheet:</div>
            <div class="sheet-selector">
                <select id="sheet-select">
                    <option value="default">Default Sheet</option>
                    <option value="work">Work Notes</option>
                    <option value="personal">Personal Notes</option>
                    <option value="research">Research</option>
                </select>
                <button id="manage-sheets" class="manage-sheets-btn">Manage Sheets</button>
            </div>
        </div>
    `;
    
    // Add tags section
    content += `
        <div class="metadata-item">
            <div class="metadata-label">Tags:</div>
            <div class="tags-container">
                <div class="tags-input">
                    <input type="text" id="tag-input" placeholder="Add tags (press Enter)">
                    <div class="suggested-tags">
                        <span class="tag-suggestion" data-tag="Important">Important</span>
                        <span class="tag-suggestion" data-tag="To-Do">To-Do</span>
                        <span class="tag-suggestion" data-tag="Reference">Reference</span>
                        <span class="tag-suggestion" data-tag="Question">Question</span>
                    </div>
                </div>
                <div class="selected-tags" id="selected-tags"></div>
            </div>
        </div>
    `;
    
    // Add common metadata
    content += `
        <div class="metadata-item">
            <div class="metadata-label">Page Title:</div>
            <div class="metadata-value">${metadata.pageTitle}</div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">URL:</div>
            <div class="metadata-value">${metadata.pageUrl}</div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Timestamp:</div>
            <div class="metadata-value">${metadata.timestamp}</div>
        </div>
        <div class="button-container">
            <button class="button cancel-button" id="cancel-button">Cancel</button>
            <button class="button confirm-button" id="confirm-button">Send to Sheet</button>
        </div>
    `;
    
    popup.innerHTML = `
        <div class="overlay"></div>
        <div class="confirmation-popup">
            ${content}
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .confirmation-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .sheet-selector {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        #sheet-select {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
        }
        .manage-sheets-btn {
            padding: 8px 12px;
            background: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .manage-sheets-btn:hover {
            background: #e0e0e0;
        }
        .selections-list {
            max-height: 300px;
            overflow-y: auto;
            margin: 10px 0;
        }
        .selection-item {
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            position: relative;
        }
        .selection-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        .selection-number {
            font-weight: bold;
            color: #4CAF50;
        }
        .remove-selection {
            background: none;
            border: none;
            color: #ff4444;
            font-size: 20px;
            cursor: pointer;
            padding: 0 5px;
        }
        .selection-text {
            white-space: pre-wrap;
            word-break: break-word;
        }
        .tags-container {
            margin-top: 8px;
        }
        .tags-input {
            position: relative;
        }
        #tag-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        .suggested-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;
        }
        .tag-suggestion {
            background: #e0e0e0;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        .tag-suggestion:hover {
            background: #d0d0d0;
        }
        .selected-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .tag {
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .tag-remove {
            cursor: pointer;
            font-weight: bold;
        }
        .metadata-item {
            margin: 10px 0;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        .metadata-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
        }
        .metadata-value {
            word-break: break-word;
        }
        .button-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        .button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .cancel-button {
            background: #f44336;
            color: white;
        }
        .confirm-button {
            background: #4CAF50;
            color: white;
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(popup);

    // Initialize sheet selector
    const sheetSelect = popup.querySelector('#sheet-select');
    const manageSheetsBtn = popup.querySelector('#manage-sheets');

    // Load saved sheets from storage
    chrome.storage.sync.get(['sheets', 'defaultSheet'], function(result) {
        if (result.sheets) {
            // Clear default options
            sheetSelect.innerHTML = '';
            
            // Add saved sheets
            result.sheets.forEach(sheet => {
                const option = document.createElement('option');
                option.value = sheet.id;
                option.textContent = sheet.name;
                sheetSelect.appendChild(option);
            });
            
            // Set default sheet if saved
            if (result.defaultSheet) {
                sheetSelect.value = result.defaultSheet;
            }
        }
    });

    // Handle manage sheets button click
    manageSheetsBtn.addEventListener('click', () => {
        // Create manage sheets popup
        const managePopup = document.createElement('div');
        managePopup.innerHTML = `
            <div class="overlay"></div>
            <div class="manage-sheets-popup">
                <h3>Manage Sheets</h3>
                <div class="sheets-list"></div>
                <div class="add-sheet">
                    <input type="text" id="new-sheet-name" placeholder="New sheet name">
                    <button id="add-sheet-btn">Add Sheet</button>
                </div>
                <div class="button-container">
                    <button class="button cancel-button" id="close-manage">Close</button>
                </div>
            </div>
        `;

        // Add styles for manage sheets popup
        const manageStyle = document.createElement('style');
        manageStyle.textContent = `
            .manage-sheets-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10002;
                width: 300px;
            }
            .sheets-list {
                margin: 15px 0;
                max-height: 200px;
                overflow-y: auto;
            }
            .sheet-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: #f5f5f5;
                margin: 5px 0;
                border-radius: 4px;
            }
            .sheet-item button {
                background: none;
                border: none;
                color: #ff4444;
                cursor: pointer;
                padding: 0 5px;
            }
            .add-sheet {
                display: flex;
                gap: 10px;
                margin: 15px 0;
            }
            .add-sheet input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .add-sheet button {
                padding: 8px 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(manageStyle);
        document.body.appendChild(managePopup);

        // Load and display sheets
        function loadSheets() {
            chrome.storage.sync.get(['sheets'], function(result) {
                const sheetsList = managePopup.querySelector('.sheets-list');
                sheetsList.innerHTML = '';
                
                if (result.sheets) {
                    result.sheets.forEach(sheet => {
                        const sheetItem = document.createElement('div');
                        sheetItem.className = 'sheet-item';
                        sheetItem.innerHTML = `
                            <span>${sheet.name}</span>
                            <button class="delete-sheet" data-id="${sheet.id}">×</button>
                        `;
                        sheetsList.appendChild(sheetItem);
                    });
                }
            });
        }

        // Load initial sheets
        loadSheets();

        // Handle add sheet
        const addSheetBtn = managePopup.querySelector('#add-sheet-btn');
        const newSheetInput = managePopup.querySelector('#new-sheet-name');

        addSheetBtn.addEventListener('click', () => {
            const sheetName = newSheetInput.value.trim();
            if (sheetName) {
                chrome.storage.sync.get(['sheets'], function(result) {
                    const sheets = result.sheets || [];
                    const newSheet = {
                        id: `sheet_${Date.now()}`,
                        name: sheetName
                    };
                    sheets.push(newSheet);
                    
                    chrome.storage.sync.set({ sheets: sheets }, function() {
                        newSheetInput.value = '';
                        loadSheets();
                        
                        // Add to main popup's select
                        const option = document.createElement('option');
                        option.value = newSheet.id;
                        option.textContent = newSheet.name;
                        sheetSelect.appendChild(option);
                    });
                });
            }
        });

        // Handle delete sheet
        managePopup.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-sheet')) {
                const sheetId = e.target.dataset.id;
                chrome.storage.sync.get(['sheets'], function(result) {
                    const sheets = result.sheets.filter(sheet => sheet.id !== sheetId);
                    chrome.storage.sync.set({ sheets: sheets }, function() {
                        loadSheets();
                        
                        // Remove from main popup's select
                        const option = sheetSelect.querySelector(`option[value="${sheetId}"]`);
                        if (option) {
                            option.remove();
                        }
                    });
                });
            }
        });

        // Handle close
        managePopup.querySelector('#close-manage').addEventListener('click', () => {
            managePopup.remove();
        });
    });

    // Initialize tags
    const selectedTags = new Set();
    const tagInput = popup.querySelector('#tag-input');
    const selectedTagsContainer = popup.querySelector('#selected-tags');

    // Function to add a tag
    function addTag(tag) {
        if (tag && !selectedTags.has(tag)) {
            selectedTags.add(tag);
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove">×</span>
            `;
            tagElement.querySelector('.tag-remove').addEventListener('click', () => {
                selectedTags.delete(tag);
                tagElement.remove();
            });
            selectedTagsContainer.appendChild(tagElement);
        }
        tagInput.value = '';
    }

    // Handle tag input
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && tagInput.value.trim()) {
            e.preventDefault();
            addTag(tagInput.value.trim());
        }
    });

    // Handle suggested tags
    popup.querySelectorAll('.tag-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            addTag(suggestion.dataset.tag);
        });
    });

    // Handle button clicks
    const confirmButton = popup.querySelector('#confirm-button');
    const cancelButton = popup.querySelector('#cancel-button');

    confirmButton.addEventListener('click', async () => {
        if (isSaving) {
            return;
        }

        // Add tags and sheet ID to metadata
        metadata.tags = Array.from(selectedTags);
        metadata.sheetId = sheetSelect.value;

        // If multiple selections, create an array of metadata objects
        const dataToSend = selections.size > 1
            ? Array.from(selections.values()).map(selection => ({
                selectedText: selection.text,
                pageTitle: metadata.pageTitle,
                pageUrl: metadata.pageUrl,
                timestamp: metadata.timestamp,
                tags: metadata.tags,
                sheetId: metadata.sheetId
            }))
            : [metadata];

        // Set saving flag
        isSaving = true;

        // Show loading state
        confirmButton.disabled = true;
        confirmButton.textContent = 'Sending...';
        
        const maxRetries = 3;
        let retryCount = 0;
        
        const sendToSheet = async () => {
            try {
                const webhookUrl = 'https://script.google.com/macros/s/AKfycbzYHqPlA2Ot7xvq4l4Ce58-wZcK22kawwQhd4PG0bQKjd56lIcQomGtwQ5sX-6eF8ge/exec';
                
                // Send each selection
                for (const data of dataToSend) {
                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        mode: 'no-cors',
                        body: JSON.stringify(data)
                    });

                    if (response.type !== 'opaque') {
                        throw new Error('Failed to save highlight');
                    }
                }

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #4CAF50;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 4px;
                    z-index: 10002;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                `;
                successMessage.textContent = dataToSend.length > 1 
                    ? `${dataToSend.length} highlights saved successfully!`
                    : 'Highlight saved successfully!';
                document.body.appendChild(successMessage);
                
                setTimeout(() => {
                    successMessage.remove();
                }, 3000);
                
                // Clear selections and hide button
                selections.clear();
                hideButton();
                popup.remove();
            } catch (error) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return sendToSheet();
                }
                
                // Show error message with retry option
                const errorMessage = document.createElement('div');
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #f44336;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 4px;
                    z-index: 10002;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                
                const errorText = document.createElement('span');
                errorText.textContent = `Error saving highlight: ${error.message}`;
                
                const retryButton = document.createElement('button');
                retryButton.textContent = 'Retry';
                retryButton.style.cssText = `
                    background: white;
                    color: #f44336;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                `;
                
                retryButton.addEventListener('click', () => {
                    errorMessage.remove();
                    retryCount = 0;
                    sendToSheet();
                });
                
                errorMessage.appendChild(errorText);
                errorMessage.appendChild(retryButton);
                document.body.appendChild(errorMessage);
                
                setTimeout(() => {
                    if (document.body.contains(errorMessage)) {
                        errorMessage.remove();
                    }
                }, 10000);
            } finally {
                // Reset button state and saving flag
                confirmButton.disabled = false;
                confirmButton.textContent = 'Send to Sheet';
                isSaving = false;
            }
        };
        
        await sendToSheet();
    });

    cancelButton.addEventListener('click', () => {
        selections.clear();
        hideButton();
        popup.remove();
    });

    // Close popup when clicking outside
    popup.querySelector('.overlay').addEventListener('click', () => {
        selections.clear();
        hideButton();
        popup.remove();
    });

    // Add event listener for removing selections
    popup.querySelectorAll('.remove-selection').forEach(button => {
        button.addEventListener('click', (e) => {
            const selectionId = e.target.dataset.id;
            selections.delete(selectionId);
            
            // Update the popup content
            const selectionsList = popup.querySelector('.selections-list');
            if (selectionsList) {
                selectionsList.innerHTML = Array.from(selections.entries())
                    .map(([id, selection], index) => `
                        <div class="selection-item">
                            <div class="selection-header">
                                <span class="selection-number">#${index + 1}</span>
                                <button class="remove-selection" data-id="${id}">×</button>
                            </div>
                            <div class="selection-text">${selection.text}</div>
                        </div>
                    `).join('');
                
                // Update the title
                const title = popup.querySelector('h2');
                if (title) {
                    title.textContent = `Confirm ${selections.size} Highlights`;
                }
                
                // If no selections left, close the popup
                if (selections.size === 0) {
                    document.body.removeChild(popup);
                }
            }
        });
    });
}

// Update the floating button click handler
floatingButton.addEventListener('click', function() {
    const metadata = {
        selectedText: Array.from(selections.values())[0]?.text || '',
        pageTitle: document.title,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
    };
    showConfirmationPopup(metadata);
});
