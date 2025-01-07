/*
 * BiLangPage - Bilingual Web Experience
 * https://github.com/wujiuye/bilangpage
 *
 * Copyright (C) 2024 BiLangPage
 * Author: wujiuye <wujiuye99@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.
 */

class SelectionTranslator {
  constructor(translationService, themes) {
    this.translationService = translationService;
    this.themes = themes;
    this.selectedText = '';
    this.selectionEnabled = false;
    this.selectionTimeout = null;
    this.lastSettings = {};
    this.isProcessingChange = false;
    
    // 创建 UI 元素
    this.createUI();
    // 初始化事件监听
    this.initializeEventListeners();
    // 初始化状态
    this.initializeState();
    // 初始化时设置默认主题的图标
    this.initializeIconStyle();
    // 启动设置轮询
    this.startSettingsPolling();
  }

  // 添加初始化图标样式的方法
  async initializeIconStyle() {
    const { theme = 'dark' } = await chrome.storage.sync.get(['theme']);
    this.updateIconStyle(theme);
  }

  createUI() {
    // 创建翻译图标
    this.translateIcon = document.createElement('div');
    this.translateIcon.className = 'bilingual-translate-icon';

    // 创建翻译弹窗
    this.translatePopup = document.createElement('div');
    this.translatePopup.className = 'bilingual-translate-popup';

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
    try {
      // 获取初始状态
      const { selectionEnabled } = await chrome.storage.sync.get(['selectionEnabled']);
      this.selectionEnabled = selectionEnabled === true;
      return this.selectionEnabled;
    } catch (error) {
      console.error('初始化状态失败:', error);
      return false;
    }
  }

  async startSettingsPolling() {
    setInterval(async () => {
      if (this.isProcessingChange) {
        return;
      }

      try {
        const settings = await chrome.storage.sync.get(['selectionEnabled', 'theme']);
        if (this.settingsChanged(settings)) {
          this.isProcessingChange = true;
          await this.handleSettingChange(settings);
          this.lastSettings = settings;
          this.isProcessingChange = false;
        }
      } catch (error) {
        console.error('Settings polling error:', error);
        this.isProcessingChange = false;
      }
    }, 3000);
  }

  async handleSettingChange(settings) {
    // 处理划词翻译启用状态变化
    if ('selectionEnabled' in settings && this.selectionEnabled !== settings.selectionEnabled) {
      this.selectionEnabled = settings.selectionEnabled;
      if (!this.selectionEnabled) {
        this.hideUI();
      }
    }

    // 处理主题变化
    if (settings.theme) {
      this.updateIconStyle(settings.theme);
    }
  }

  settingsChanged(newSettings) {
    const oldKeys = Object.keys(this.lastSettings);
    const newKeys = Object.keys(newSettings);
    
    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    return oldKeys.some(key => 
      this.lastSettings[key] !== newSettings[key]
    );
  }

  initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (this.isProcessingChange) {
        return true;
      }
      
      this.handleSettingChange(message);
      return true;
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
    // 获取选区的所有矩形
    const rects = range.getClientRects();
    if (!rects.length) return;

    // 使用第一个矩形（通常是选区的开始位置）
    const lastRect = rects[0];
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // 如果位置为0
    if (lastRect.right === 0 && lastRect.top === 0) {
      return // 暂不支持父容器是flex布局
    } else {
      this.translateIcon.style.left = `${lastRect.right + scrollX + 10}px`;
      this.translateIcon.style.top = `${lastRect.top + scrollY}px`;
    }

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
    const styles = currentTheme.styles;
    
    this.translateIcon.style.cssText = `
      position: absolute;
      display: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${styles.backgroundColor};
      background-image: url('${styles.iconSvg}');
      background-size: 16px;
      background-repeat: no-repeat;
      background-position: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.2s ease;
      border: 1px solid ${styles.borderLeftColor}22;
    `;
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
      } else {
        this.showError();
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

  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    // 移除 UI 元素
    if (this.translateIcon) {
      this.translateIcon.remove();
    }
    if (this.translatePopup) {
      this.translatePopup.remove();
    }
  }
}

// 导出类
window.SelectionTranslator = SelectionTranslator; 