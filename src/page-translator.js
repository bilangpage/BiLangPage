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

class PageTranslator {
  constructor(translationService, themes) {
    this.translationService = translationService;
    this.themes = themes;
    this.translatedTexts = new Set();
    this.observer = null;
    this.enabled = false;
    this.lastSettings = {};
    this.isProcessingChange = false; // 添加处理锁

    // 添加 MD5 哈希函数
    this.md5 = function(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    };

    // 绑定方法
    this.translateElements = this.translateElements.bind(this);
    this.debouncedTranslate = this.debounce(this.translateElements, 200);
    
    // 初始化消息监听和轮询
    this.initializeMessageListener();
    this.startSettingsPolling();
  }

  initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 如果正在处理轮询变化，跳过消息处理
      if (this.isProcessingChange) {
        return true;
      }
      
      this.handleSettingChange(message);
      return true;
    });
  }

  async startSettingsPolling() {
    setInterval(async () => {
      if (this.isProcessingChange) {
        return; // 如果正在处理变化，跳过本次轮询
      }

      try {
        const settings = await chrome.storage.sync.get(['enabled', 'targetLang', 'theme']);
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
    }, 1500);
  }

  async handleSettingChange(settings) {
    // 处理启用状态变化
    if ('enabled' in settings && this.enabled !== settings.enabled) {
      this.enabled = settings.enabled;
      if (!this.enabled) {
        this.removeAllTranslations();
      } else {
        await this.debouncedTranslate();
      }
    }

    // 处理目标语言变化
    if (settings.targetLang && this.translationService.targetLang !== settings.targetLang) {
      this.translationService.setTargetLang(settings.targetLang);
      if (this.enabled) {
        this.removeAllTranslations();
        await this.debouncedTranslate();
      }
    }

    // 处理主题变化
    if (settings.theme) {
      this.updateTranslationsStyle(settings.theme);
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

  async initializeState() {
    try {
      // 获取初始设置
      const { targetLang, enabled = true } = await chrome.storage.sync.get(['targetLang', 'enabled']);
      
      // 设置初始状态
      this.enabled = enabled;
      if (targetLang) {
        this.translationService.setTargetLang(targetLang);
      }

      return enabled;
    } catch (error) {
      console.error('初始化状态失败:', error);
      return false;
    }
  }

  async initialize() {
    try {
      // 等待状态初始化完成
      const enabled = await this.initializeState();
      
      // 如果禁用了翻译，不进行初始化
      if (!enabled) {
        console.log('Translation is disabled, skipping initialization');
        return;
      }

      // 配置观察器
      this.observer = new MutationObserver((mutations) => {
        if (!this.enabled) return;  // 如果禁用了翻译，直接返回

        const currentSite = window.siteAdapters.getSiteAdapter(window.location.hostname);
        if (!currentSite) return;

        const hasNewContent = mutations.some(mutation =>
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== 1) return false;

            // 如果是翻译元素，直接跳过
            if (node.classList?.contains('bilingual-translation')) return false;

            // 如果节点或其父节点已经被翻译过，跳过
            let currentNode = node;
            while (currentNode) {
              if (currentNode.hasAttribute('data-translated')) return false;
              currentNode = currentNode.parentElement;
            }

            // 检查是否匹配选择器
            return currentSite.selectors.some(selector =>
              selector.elements.some(selectorStr => {
                if (selectorStr.includes(' ')) {
                  return document.querySelector(selectorStr) !== null;
                }
                return node.matches(selectorStr);
              })
            );
          })
        );

        if (hasNewContent) {
          // 开始翻译新的内容
          this.debouncedTranslate();
        }
      });

      // 开始观察页面变化
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // 开始首次翻译
      await this.translateElements();
    } catch (error) {
      console.error('PageTranslator 初始化失败:', error);
    }
  }

  async translateElements() {
    if (!this.enabled) return;  // 如果禁用了翻译，直接返回

    const { theme = 'dark' } = await chrome.storage.sync.get(['theme']);
    const currentTheme = this.themes[theme] || this.themes.dark;

    // 获取当前网站的适配器
    const currentSite = window.siteAdapters.getSiteAdapter(window.location.hostname);
    if (!currentSite) {
      return;
    }

    // 根据网站类型使用不同的翻译文本集合更新策略
    const isTwitter = window.location.hostname.includes('x.com');
    if (isTwitter) {
      // 对于 Twitter/X，清除并只保留当前存在于页面中的翻译
      this.translatedTexts.clear();
      document.querySelectorAll('.bilingual-translation').forEach(el => {
        const originalText = el.getAttribute('data-original-text');
        if (originalText && document.contains(el)) {
          this.translatedTexts.add(this.md5(originalText));
        }
      });
    } else {
      // 对于其他网站，只添加新的翻译，不清除旧的
      document.querySelectorAll('.bilingual-translation').forEach(el => {
        const originalText = el.getAttribute('data-original-text');
        if (originalText) {
          this.translatedTexts.add(this.md5(originalText));
        }
      });
    }

    console.log(`Using ${currentSite.name} adapter`);

    // 获取所有需要翻译的元素
    const elements = this.getTranslatableElements(currentSite);
    console.log(`Found ${elements.length} elements to translate`);

    for (const element of elements) {
      await this.translateElement(element, currentSite, currentTheme);
    }
  }

  getTranslatableElements(currentSite) {
    return currentSite.selectors.flatMap(selector => {
      return selector.elements.flatMap(selectorStr => {
        // 检查是否是简单的空格分隔的标签选择器
        if (!selectorStr.includes('.') && !selectorStr.includes('#') && !selectorStr.includes('[')) {
          // 处理多层标签选择器 (例如: "parent child grandchild")
          const parts = selectorStr.split(' ');
          if (parts.length > 1) {
            // 从第一个标签开始，逐层查找
            let elements = Array.from(document.getElementsByTagName(parts[0]));
            for (let i = 1; i < parts.length; i++) {
              elements = elements.flatMap(parent =>
                Array.from(parent.getElementsByTagName(parts[i]))
              );
            }
            return elements;
          }
        }
        // 对于复杂的选择器，使用 querySelectorAll
        return Array.from(document.querySelectorAll(selectorStr));
      });
    });
  }

  async translateElement(element, currentSite, currentTheme) {
    try {
      // 跳过已翻译的元素
      if (element.hasAttribute('data-translated')) {
        return;
      }

      // 检查是否是 Reddit 标题
      const isRedditTitle = window.location.hostname.includes('reddit.com') && 
        (element.matches('shreddit-post a[slot="title"]') || element.matches('h1[slot="title"]'));

      // 检查是否已经存在译文
      if (isRedditTitle) {
        // 对于 Reddit 标题，检查内部的翻译元素
        const existingTranslation = element.querySelector('.bilingual-translation');
        if (existingTranslation) {
          return;  // 已存在译文，直接返回
        }
      } else {
        // 对于其他元素，检查下一个兄弟元素
        if (element.nextElementSibling?.classList?.contains('bilingual-translation')) {
          return;  // 已存在译文，直接返回
        }
      }

      // 获取原文
      const originalText = currentSite.processElement
        ? currentSite.processElement(element)
        : element.textContent.trim();

      if (!originalText) return;

      // 检查是否已经翻译过相同的文本
      const textHash = this.md5(originalText);
      if (this.translatedTexts.has(textHash)) {
        return;
      }
      // 先添加到已翻译集合再翻译
      this.translatedTexts.add(textHash);

      // 翻译文本
      const translatedText = await this.translationService.translate(originalText);
      if (translatedText === "") {
        return;
      }
  
      // 创建翻译元素
      const translationElement = this.createTranslationElement(originalText, translatedText, currentTheme);

      // 插入翻译元素
      if (isRedditTitle) {
        // Reddit 标题：将翻译插入标签内部
        // 查找 faceplate-perfmark 标签作为插入点
        const faceplateElement = element.querySelector('faceplate-perfmark');
        if (faceplateElement) {
          element.insertBefore(translationElement, faceplateElement);
        } else {
          element.appendChild(translationElement);
        }
      } else {
        // 其他元素：保持原有的同级插入方式
        element.parentNode.insertBefore(translationElement, element.nextSibling);
      }

      // 标记原始元素已翻译
      element.setAttribute('data-translated', 'true');
    } catch (error) {
      console.error(`处理元素时出错: ${error.message}`);
    }
  }

  createTranslationElement(originalText, translatedText, currentTheme) {
    const translationElement = document.createElement('div');
    translationElement.className = 'bilingual-translation';
    translationElement.textContent = translatedText;
    translationElement.setAttribute('data-original-text', originalText);
    translationElement.style.cssText = `
      display: block !important;
      visibility: visible !important;
      margin-top: 8px !important;
      padding: 8px 12px !important;
      border-left: 3px solid ${currentTheme.styles.borderLeftColor} !important;
      color: ${currentTheme.styles.color} !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      opacity: 1 !important;
      height: auto !important;
      overflow: visible !important;
      position: relative !important;
      z-index: 1 !important;
      background-color: ${currentTheme.styles.backgroundColor} !important;
      margin-left: 4px !important;
      pointer-events: none !important;
      clear: both !important;
      width: fit-content !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      border-radius: 4px !important;
    `;
    return translationElement;
  }

  removeAllTranslations() {
    const elements = document.querySelectorAll('[data-translated]');
    elements.forEach(el => {
      // 检查是否是 Reddit 标题
      const isRedditTitle = window.location.hostname.includes('reddit.com') && 
        (el.matches('shreddit-post a[slot="title"]') || el.matches('h1[slot="title"]'));

      if (isRedditTitle) {
        // 对于 Reddit 标题，移除内部的翻译元素
        const translation = el.querySelector('.bilingual-translation');
        if (translation) {
          translation.remove();
        }
      } else {
        // 对于其他元素，移除下一个兄弟元素
        if (el.nextSibling && el.nextSibling.className === 'bilingual-translation') {
          el.nextSibling.remove();
        }
      }
      el.removeAttribute('data-translated');
    });
    this.translatedTexts.clear();
  }

  debounce(func, wait) {
    let timeout;
    const boundFunc = func.bind(this);  // 绑定 this 上下文
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        boundFunc(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.removeAllTranslations();
  }

  // 添加新方法：更新所有翻译的样式
  async updateTranslationsStyle(theme) {
    const currentTheme = this.themes[theme] || this.themes.dark;
    const translations = document.querySelectorAll('.bilingual-translation');
    
    translations.forEach(translation => {
      translation.style.cssText = `
        display: block !important;
        visibility: visible !important;
        margin-top: 8px !important;
        padding: 8px 12px !important;
        border-left: 3px solid ${currentTheme.styles.borderLeftColor} !important;
        color: ${currentTheme.styles.color} !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        opacity: 1 !important;
        height: auto !important;
        overflow: visible !important;
        position: relative !important;
        z-index: 1 !important;
        background-color: ${currentTheme.styles.backgroundColor} !important;
        margin-left: 4px !important;
        pointer-events: none !important;
        clear: both !important;
        width: fit-content !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        border-radius: 4px !important;
      `;
    });
  }
}

// 导出类
window.PageTranslator = PageTranslator; 