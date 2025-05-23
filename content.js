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
        try {
            // Replace this URL with your deployed Google Apps Script web app URL
            const webhookUrl = 'https://script.google.com/macros/s/AKfycbySBri0YFNCyMdLkWOrPWQKpsOVoUPo4sC2xBW5J6gfvo4lpbsGnAXtsSHM3OfJ0gHF/exec';
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
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
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            // Show error message
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
            errorMessage.textContent = 'Error saving highlight: ' + error.message;
            document.body.appendChild(errorMessage);
            
            // Remove error message after 3 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
        }
        
        popup.remove();
    this.style.display = 'none';
    });

    cancelButton.addEventListener('click', () => {
        popup.remove();
    });

    // Close popup when clicking outside
    popup.querySelector('.overlay').addEventListener('click', () => {
        popup.remove();
    });
});
