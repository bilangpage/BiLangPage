/*
 * BiLangPage - Bilingual Web Experience
 * https://github.com/wujiuye/bilangpage
 *
 * Copyright (C) 2024 BiLangPage
 * Author: wujiuye <wujiuye99@gmail.com>
 */

class SelectionTranslator {
  constructor(translationService, themes) {
    this.translationService = translationService;
    this.themes = themes;
    this.selectedText = '';
    this.selectionEnabled = false;
    this.selectionTimeout = null;
    
    // 创建 UI 元素
    this.createUI();
    // 初始化事件监听
    this.initializeEventListeners();
    // 初始化状态
    this.initializeState();
  }

  createUI() {
    // 创建翻译图标
    this.translateIcon = document.createElement('div');
    this.translateIcon.className = 'bilingual-translate-icon';
    this.translateIcon.style.cssText = `
      position: absolute;
      display: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 999999;
      background-size: 16px;
      background-repeat: no-repeat;
      background-position: center;
      transition: transform 0.2s ease;
    `;

    // 创建翻译弹窗
    this.translatePopup = document.createElement('div');
    this.translatePopup.className = 'bilingual-translate-popup';
    this.translatePopup.style.cssText = `
      position: absolute;
      display: none;
      max-width: 300px;
      padding: 16px;
      border-radius: 12px;
      z-index: 999999;
      font-size: 14px;
      line-height: 1.4;
    `;

    // 添加到页面
    document.body.appendChild(this.translateIcon);
    document.body.appendChild(this.translatePopup);
  }

  initializeEventListeners() {
    // 图标悬停效果
    this.translateIcon.addEventListener('mouseenter', () => {
      this.translateIcon.style.transform = 'scale(1.1)';
    });
    this.translateIcon.addEventListener('mouseleave', () => {
      this.translateIcon.style.transform = 'scale(1)';
    });

    // 双击事件
    document.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // 选择文本事件
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // 点击事件（关闭弹窗）
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    // 滚动事件
    document.addEventListener('scroll', this.handleScroll.bind(this));

    // 翻译图标点击事件
    this.translateIcon.addEventListener('click', this.handleTranslateClick.bind(this));
  }

  async initializeState() {
    // 获取初始状态
    const { selectionEnabled } = await chrome.storage.sync.get(['selectionEnabled']);
    this.selectionEnabled = selectionEnabled === true;

    // 监听状态变化
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'toggleSelection') {
        this.selectionEnabled = message.enabled;
        if (!this.selectionEnabled) {
          this.hideUI();
        }
      }
    });

    // 监听主题变化
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.theme) {
        this.updateIconStyle(changes.theme.newValue);
      }
    });
  }

  isSelectionInTranslation(selection) {
    if (!selection.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    if (container.nodeType === Node.TEXT_NODE) {
      return this.isElementTranslation(container.parentElement);
    }
    
    return this.isElementTranslation(container);
  }

  isElementTranslation(element) {
    if (!element) return false;
    return (
      element.classList?.contains('bilingual-translation') ||
      element.classList?.contains('bilingual-translate-popup') ||
      element.closest('.bilingual-translation') !== null ||
      element.closest('.bilingual-translate-popup') !== null
    );
  }

  updateIconPosition(range) {
    const rect = range.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    this.translateIcon.style.left = `${rect.right + scrollX + 10}px`;
    this.translateIcon.style.top = `${rect.top + scrollY}px`;
    this.translateIcon.style.display = 'block';

    if (this.translatePopup.style.display === 'block') {
      this.updatePopupPosition();
    }
  }

  updatePopupPosition() {
    this.translatePopup.style.left = `${this.translateIcon.offsetLeft + 30}px`;
    this.translatePopup.style.top = `${this.translateIcon.offsetTop}px`;
  }

  updateIconStyle(theme) {
    const currentTheme = this.themes[theme] || this.themes.dark;
    this.translateIcon.style.backgroundColor = currentTheme.styles.backgroundColor;
    
    const iconColor = currentTheme.styles.color.replace('#', '%23');
    this.translateIcon.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColor}"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>')`;
  }

  handleDoubleClick(e) {
    if (!this.selectionEnabled) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (!text || this.isSelectionInTranslation(selection)) {
      return;
    }

    this.selectedText = text;
    const range = selection.getRangeAt(0);
    this.updateIconPosition(range);
  }

  handleMouseUp(e) {
    if (!this.selectionEnabled) return;

    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (!text || this.isSelectionInTranslation(selection)) {
        return;
      }

      if (text && text !== this.selectedText && !this.translatePopup.contains(e.target)) {
        this.selectedText = text;
        const range = selection.getRangeAt(0);
        this.updateIconPosition(range);
      } else if (!text) {
        if (!this.translatePopup.contains(e.target) && !this.translateIcon.contains(e.target)) {
          this.hideUI();
        }
      }
    }, 200);
  }

  handleDocumentClick(e) {
    if (!this.translatePopup.contains(e.target) && !this.translateIcon.contains(e.target)) {
      this.hideUI();
    }
  }

  handleScroll() {
    this.hideUI();
  }

  async handleTranslateClick() {
    if (!this.selectedText) return;

    const { theme = 'dark' } = await chrome.storage.sync.get(['theme']);
    const currentTheme = this.themes[theme] || this.themes.dark;

    this.showLoadingState();
    
    try {
      const translatedText = await this.translationService.translate(this.selectedText);
      if (translatedText) {
        this.showTranslation(translatedText, currentTheme);
      }
    } catch (error) {
      this.showError();
    }
  }

  showLoadingState() {
    this.translatePopup.textContent = '翻译中...';
    this.translatePopup.style.display = 'block';
    this.updatePopupPosition();
  }

  showTranslation(translatedText, currentTheme) {
    this.translatePopup.style.cssText = `
      position: absolute;
      display: block;
      max-width: 300px;
      padding: 16px;
      background-color: ${currentTheme.styles.backgroundColor};
      color: ${currentTheme.styles.color};
      border-radius: 12px;
      box-shadow: 
        0 12px 24px rgba(0, 0, 0, 0.4),
        0 0 0 1px ${currentTheme.styles.borderLeftColor}66,
        0 0 0 3px ${currentTheme.styles.backgroundColor},
        0 0 0 4px ${currentTheme.styles.borderLeftColor}22;
      z-index: 999999;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    this.translatePopup.innerHTML = `
      <div style="
        margin-bottom: 12px; 
        opacity: 0.6; 
        font-size: 13px;
        padding-bottom: 8px;
        border-bottom: 1px solid ${currentTheme.styles.borderLeftColor}22;
      ">${this.selectedText}</div>
      <div style="
        border-left: 3px solid ${currentTheme.styles.borderLeftColor}; 
        padding-left: 8px;
      ">${translatedText}</div>
    `;
    
    this.updatePopupPosition();
  }

  showError() {
    this.translatePopup.textContent = '翻译失败，请稍后重试';
  }

  hideUI() {
    this.translateIcon.style.display = 'none';
    this.translatePopup.style.display = 'none';
    this.selectedText = '';
  }
}

// 导出类
window.SelectionTranslator = SelectionTranslator; 