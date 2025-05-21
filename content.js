
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
    console.log('Saving text:', selectedText);
    this.style.display = 'none';
});
