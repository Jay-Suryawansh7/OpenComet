(function() {
  'use strict';

  let selectionButton = null;
  let debounceTimer = null;

  function createSelectionButton() {
    const container = document.createElement('div');
    container.className = 'inline-assistant-btn';
    container.style.cssText = 
      'position: fixed;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'gap: 4px;' +
      'padding: 6px 10px;' +
      'background: linear-gradient(135deg, #0d1017 0%, #1a1d24 100%);' +
      'border: 1px solid rgba(255,255,255,0.1);' +
      'border-radius: 8px;' +
      'box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(6,182,212,0.1);' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;' +
      'font-size: 12px;' +
      'color: rgba(255,255,255,0.8);' +
      'cursor: pointer;' +
      'user-select: none;' +
      'z-index: 2147483647;' +
      'animation: inlineAssistantFadeIn 0.15s ease-out;';

    const boltSpan = document.createElement('span');
    boltSpan.style.cssText = 'font-size: 14px;';
    boltSpan.textContent = '\u26A1';

    const textSpan = document.createElement('span');
    textSpan.style.cssText = 'font-weight: 500;';
    textSpan.textContent = 'Ask Comet';

    container.appendChild(boltSpan);
    container.appendChild(textSpan);
    container.addEventListener('click', handleButtonClick);
    
    return container;
  }

  function handleButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    
    if (text.length > 10) {
      const range = selection ? selection.getRangeAt(0) : null;
      if (range) {
        const rect = range.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.bottom + 8;
        
        window.postMessage({
          type: 'INLINE_ASSISTANT_SELECTION',
          text: text,
          x: x,
          y: y
        }, '*');
      }
    }
  }

  function showButton(x, y) {
    hideButton();
    
    selectionButton = createSelectionButton();
    document.body.appendChild(selectionButton);
    
    const buttonWidth = 100;
    const buttonHeight = 36;
    
    let left = x - buttonWidth / 2;
    let top = y;
    
    if (left < 10) left = 10;
    if (left + buttonWidth > window.innerWidth - 10) {
      left = window.innerWidth - buttonWidth - 10;
    }
    if (top + buttonHeight > window.innerHeight - 10) {
      top = y - buttonHeight - 10;
    }
    
    selectionButton.style.left = left + 'px';
    selectionButton.style.top = top + 'px';
  }

  function hideButton() {
    if (selectionButton && selectionButton.parentNode) {
      selectionButton.parentNode.removeChild(selectionButton);
    }
    selectionButton = null;
  }

  function handleMouseUp(e) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(function() {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      
      if (text.length > 10 && text.length < 5000) {
        const range = selection ? selection.getRangeAt(0) : null;
        if (range) {
          const rect = range.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.bottom + 8;
          showButton(x, y);
        }
      } else {
        hideButton();
      }
    }, 150);
  }

  function handleMouseDown(e) {
    const target = e.target;
    if (selectionButton && !selectionButton.contains(target)) {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (!text) {
        hideButton();
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      hideButton();
    }
  }

  function handleMessage(e) {
    if (e.data && e.data.type === 'INLINE_ASSISTANT_HIDE') {
      hideButton();
    }
  }

  var style = document.createElement('style');
  style.textContent = '@keyframes inlineAssistantFadeIn{from{opacity:0;transform:translateY(4px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}';
  document.head.appendChild(style);

  document.addEventListener('mouseup', handleMouseUp, { passive: true });
  document.addEventListener('mousedown', handleMouseDown, { passive: true });
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('message', handleMessage);

  console.log('[OpenComet] Inline Assistant content script loaded');
})();
