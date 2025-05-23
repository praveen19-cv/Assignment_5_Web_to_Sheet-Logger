const floatingButton = document.createElement('div');
floatingButton.className = 'save-to-sheet-button';
floatingButton.textContent = 'Save to Sheet';
floatingButton.style.display = 'none';
document.body.appendChild(floatingButton);

document.addEventListener('mouseup', function(e) {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        floatingButton.style.left = `${rect.left + window.scrollX}px`;
        floatingButton.style.top = `${rect.bottom + window.scrollY + 10}px`;
        floatingButton.style.display = 'block';
        
        floatingButton.dataset.selectedText = selectedText;
        console.log('Selected text:', selectedText);
    } else {
        floatingButton.style.display = 'none';
    }
});

document.addEventListener('mousedown', function(e) {
    if (!floatingButton.contains(e.target)) {
        floatingButton.style.display = 'none';
    }
});

floatingButton.addEventListener('click', function() {
    const selectedText = this.dataset.selectedText;
    const metadata = {
        selectedText: selectedText,
        pageTitle: document.title,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
    };

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
        // Show loading state
        confirmButton.disabled = true;
        confirmButton.textContent = 'Sending...';
        
        const maxRetries = 3;
        let retryCount = 0;
        
        const sendToSheet = async () => {
            try {
                // Replace this URL with your deployed Google Apps Script web app URL
                const webhookUrl = 'https://script.google.com/macros/s/AKfycbwtNZiC7bBdxRL1DcwW3-RawccVUxgzNdQ9blS0GpKZNNK_We3sAHPe_ce0wKD4cwQb/exec';
                
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'no-cors',
                    body: JSON.stringify(metadata)
                });

                // Since we're using no-cors mode, we can't read the response
                // We'll assume success if we don't get an error
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
                    
                    // Remove success message after 3 seconds
                    setTimeout(() => {
                        successMessage.remove();
                    }, 3000);
                    
                    popup.remove();
                    this.style.display = 'none';
                } else {
                    throw new Error('Failed to save highlight');
                }
            } catch (error) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    // Wait for 1 second before retrying
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
                
                // Remove error message after 10 seconds if not retried
                setTimeout(() => {
                    if (document.body.contains(errorMessage)) {
                        errorMessage.remove();
                    }
                }, 10000);
            } finally {
                // Reset button state
                confirmButton.disabled = false;
                confirmButton.textContent = 'Send to Sheet';
            }
        };
        
        await sendToSheet();
    });

    cancelButton.addEventListener('click', () => {
        popup.remove();
    });

    // Close popup when clicking outside
    popup.querySelector('.overlay').addEventListener('click', () => {
        popup.remove();
    });
});
