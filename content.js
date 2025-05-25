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

// Track the last selection to prevent duplicates
let lastSelection = {
    text: '',
    timestamp: 0
};

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
}

// Debounced selection handler
const handleSelection = debounce(function(e) {
    const selectedText = window.getSelection().toString().trim();
    
    if (isValidSelection(selectedText)) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check if this is a duplicate selection
        const now = Date.now();
        if (selectedText === lastSelection.text && now - lastSelection.timestamp < 2000) {
            return; // Ignore duplicate selection within 2 seconds
        }
        
        // Update last selection
        lastSelection = {
            text: selectedText,
            timestamp: now
        };
        
        // Position and show button
        positionButton(rect, window.scrollX, window.scrollY);
        floatingButton.style.display = 'block';
        floatingButton.dataset.selectedText = selectedText;
        
        // Fade in
        requestAnimationFrame(() => {
            floatingButton.style.opacity = '1';
        });
    } else {
        hideButton();
    }
}, 100);

// Function to hide button with fade
function hideButton() {
    floatingButton.style.opacity = '0';
    setTimeout(() => {
        floatingButton.style.display = 'none';
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
    popup.innerHTML = `
        <div class="overlay"></div>
        <div class="confirmation-popup">
            <h2>Confirm Highlight</h2>
            <div class="metadata-item">
                <div class="metadata-label">Selected Text:</div>
                <div class="metadata-value">${metadata.selectedText}</div>
            </div>
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
            color: #666;
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
        .confirm-button {
            background: #4CAF50;
            color: white;
        }
        .cancel-button {
            background: #f44336;
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

    // Handle button clicks
    const confirmButton = popup.querySelector('#confirm-button');
    const cancelButton = popup.querySelector('#cancel-button');

    confirmButton.addEventListener('click', async () => {
        // Prevent multiple saves
        if (isSaving) {
            return;
        }

        // Validate data first
        const validation = validateData(metadata);
        if (!validation.isValid) {
            // Show validation errors
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
            `;
            errorMessage.textContent = 'Validation errors: ' + validation.errors.join(', ');
            document.body.appendChild(errorMessage);
            
            setTimeout(() => {
                errorMessage.remove();
            }, 5000);
            return;
        }

        // Set saving flag
        isSaving = true;

        // Show loading state
        confirmButton.disabled = true;
        confirmButton.textContent = 'Sending...';
        
        const maxRetries = 3;
        let retryCount = 0;
        
        const sendToSheet = async () => {
            try {
                const webhookUrl = 'https://script.google.com/macros/s/AKfycbwtNZiC7bBdxRL1DcwW3-RawccVUxgzNdQ9blS0GpKZNNK_We3sAHPe_ce0wKD4cwQb/exec';
                
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'no-cors',
                    body: JSON.stringify(metadata)
                });

                if (response.type === 'opaque') {
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
                    successMessage.textContent = 'Highlight saved successfully!';
                    document.body.appendChild(successMessage);
                    
                    setTimeout(() => {
                        successMessage.remove();
                    }, 3000);
                    
                    // Clear the selection and hide button
                    lastSelection = {
                        text: '',
                        timestamp: 0
                    };
                    hideButton();
                    popup.remove();
                } else {
                    throw new Error('Failed to save highlight');
                }
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
        // Clear the selection and hide button
        lastSelection = {
            text: '',
            timestamp: 0
        };
        hideButton();
        popup.remove();
    });

    // Close popup when clicking outside
    popup.querySelector('.overlay').addEventListener('click', () => {
        // Clear the selection and hide button
        lastSelection = {
            text: '',
            timestamp: 0
        };
        hideButton();
        popup.remove();
    });
}

// Update the floating button click handler
floatingButton.addEventListener('click', function() {
    const selectedText = this.dataset.selectedText;
    const metadata = {
        selectedText: selectedText,
        pageTitle: document.title,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
    };
    showConfirmationPopup(metadata);
});
