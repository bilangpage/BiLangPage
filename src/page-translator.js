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
    this.translatedTexts = new Map();
    this.observer = null;
    this.enabled = false;
    this.enableUniversalAdapter = false;
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
    this.debouncedTranslate = this.debounce(this.translateElements, 0);
    
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
      console.log('message', message);
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
        const settings = await chrome.storage.sync.get(['enabled', 'targetLang', 'theme', 'enableUniversalAdapter']);
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
    if ('targetLang' in settings && settings.targetLang && this.translationService.targetLang !== settings.targetLang) {
      this.translationService.setTargetLang(settings.targetLang);
      if (this.enabled) {
        this.removeAllTranslations();
        await this.debouncedTranslate();
      }
    }

    // 处理主题变化
    if ('theme' in settings && settings.theme && this.theme !== settings.theme) {
      this.updateTranslationsStyle(settings.theme);
    }

    // 处理通用适配器变化
    if ('enableUniversalAdapter' in settings && this.enableUniversalAdapter !== settings.enableUniversalAdapter) {
      if (!this.enableUniversalAdapter && settings.enableUniversalAdapter) {
        this.enableUniversalAdapter = settings.enableUniversalAdapter;
        await this.debouncedTranslate();
        return;
      }else{
        this.enableUniversalAdapter = settings.enableUniversalAdapter;
        this.removeAllTranslations();
      }
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
      const { targetLang, enabled = true, enableUniversalAdapter = false } = await chrome.storage.sync.get(['targetLang', 'enabled', 'enableUniversalAdapter']);
      
      // 设置初始状态
      this.enabled = enabled;
      this.enableUniversalAdapter = enableUniversalAdapter;
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

      // 如果启用了翻译但未启用通用适配器，检测页面语言
      if (enabled && !this.enableUniversalAdapter) {
        const currentSite = window.siteAdapters.getSiteAdapter(window.location.hostname);
        if (currentSite.name === 'Default') {
          await this.detectPageLanguage();
        }
      }

      // 配置观察器
      this.observer = new MutationObserver((mutations) => {
        if (!this.enabled) return;  // 如果禁用了翻译，直接返回

        const currentSite = window.siteAdapters.getSiteAdapter(window.location.hostname);
        if (!currentSite) return;

        let needsTranslation = false;
        const processedNodes = new Set();

        for (const mutation of mutations) {
          // 处理元素移除
          if (mutation.removedNodes.length > 0) {
            mutation.removedNodes.forEach(node => {
              if (node.nodeType === 1) { // 元素节点
                // 检查移除的元素是否有翻译
                if (node.hasAttribute('data-translated')) {
                  // 获取下一个兄弟元素（翻译元素）
                  const translationElement = node.nextElementSibling;
                  if (translationElement?.classList?.contains('bilingual-translation')) {
                    const originalText = translationElement.getAttribute('data-original-text');
                    if (originalText) {
                      // 从缓存中移除该翻译
                      this.translatedTexts.delete(this.md5(originalText));
                    }
                  }
                }
                // 检查移除的元素内部的翻译
                const translations = node.querySelectorAll('.bilingual-translation');
                translations.forEach(translation => {
                  const originalText = translation.getAttribute('data-original-text');
                  if (originalText) {
                    // 从缓存中移除该翻译
                    this.translatedTexts.delete(this.md5(originalText));
                  }
                });
              }
            });
          }

          // 处理新增元素
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== 1 || processedNodes.has(node)) continue;

              // 如果是翻译元素，直接跳过
              if (node.classList?.contains('bilingual-translation')) continue;

              // 如果节点或其父节点已经被翻译过，跳过
              let currentNode = node;
              let shouldSkip = false;
              while (currentNode) {
                if (currentNode.hasAttribute('data-translated')) {
                  shouldSkip = true;
                  break;
                }
                currentNode = currentNode.parentElement;
              }
              if (shouldSkip) continue;

              // 检查是否匹配选择器
              const matchesSelector = currentSite.selectors.some(selector =>
                selector.elements.some(selectorStr => {
                  try {
                    if (selectorStr.includes(' ')) {
                      // 对于复杂选择器，检查新节点内部的元素
                      return node.querySelector(selectorStr) !== null;
                    }
                    return node.matches(selectorStr);
                  } catch (e) {
                    console.error('Invalid selector:', selectorStr, e);
                    return false;
                  }
                })
              );

              if (matchesSelector) {
                needsTranslation = true;
                processedNodes.add(node);
              }
            }
          }
        }

        // 如果需要翻译，使用防抖函数调用翻译方法
        if (needsTranslation) {
          this.debouncedTranslate();
        }
      });

      // 开始观察页面变化
      this.observer.observe(document.body, {
        childList: true, // 监听子节点变化
        subtree: true, // 监听子树变化
        attributes: false, // 不监听属性变化
        characterData: false // 不监听文本内容变化
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

    // 如果当前适配器是通用适配器且未启用，则跳过翻译
    if(currentSite.name === 'Default' && !this.enableUniversalAdapter) {
      return;
    }

    // 添加已翻译的文本
    document.querySelectorAll('.bilingual-translation').forEach(el => {
      const originalText = el.getAttribute('data-original-text');
      if (originalText) {
        this.translatedTexts.set(this.md5(originalText), el.textContent);
      }
    });

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
      // 使用 data-processing 标记来防止并发处理
      if (element.hasAttribute('data-processing')) {
        return;
      }
      element.setAttribute('data-processing', 'true');

      // 跳过已翻译的元素
      if (element.hasAttribute('data-translated')) {
        return;
      }

      // 检查父元素是否已经被翻译
      let parent = element.parentElement;
      while (parent) {
        if (parent.hasAttribute('data-translated')) {
          return;  // 如果父元素已翻译，跳过当前元素
        }
        parent = parent.parentElement;
      }

      // 获取原文
      const originalText = currentSite.processElement
        ? currentSite.processElement(element)
        : element.textContent.trim();
      if (!originalText) {
        return;
      }

      // 检查是否是 Reddit 标题
      const isRedditTitle = window.location.hostname.includes('reddit.com') && 
        (element.matches('shreddit-post a[slot="title"]') || element.matches('h1[slot="title"]'));

      // 再次检查是否已经存在译文（包括正在处理的情况）
      const existingTranslation = isRedditTitle 
        ? element.querySelector('.bilingual-translation')
        : Array.from(element.parentNode.children).find(el => 
            (el.classList?.contains('bilingual-translation') || el.hasAttribute('data-processing')) && 
            el.getAttribute('data-original-text') === originalText
          );
      if (existingTranslation) {
        return;
      }

      // 检查是否只包含已翻译的子元素
      const hasOnlyTranslatedChildren = Array.from(element.children).every(child => 
        child.hasAttribute('data-translated') || 
        child.classList.contains('bilingual-translation')
      );
      if (hasOnlyTranslatedChildren && element.children.length > 0) {
        return;
      }

      // 检查是否已经翻译过相同的文本
      const textHash = this.md5(originalText);
      let translatedText = this.translatedTexts.get(textHash);
      
      if (!translatedText) {
        // 如果没有缓存的翻译，调用翻译服务
        translatedText = await this.translationService.translate(originalText);
        // 缓存翻译结果
        if (translatedText !== "" && translatedText !== originalText) {
          this.translatedTexts.set(textHash, translatedText);
        }
      }

      // 如果翻译结果为空或与原文相同，则不添加翻译元素
      if (translatedText === "" || translatedText === originalText) {
        return;
      }

      // 再次检查是否已经存在译文（防止在翻译过程中被其他进程添加）
      const translationAddedDuringProcess = isRedditTitle 
        ? element.querySelector('.bilingual-translation')
        : Array.from(element.parentNode.children).find(el => 
            el.classList?.contains('bilingual-translation') && 
            el.getAttribute('data-original-text') === originalText
          );
      if (translationAddedDuringProcess) {
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
    } finally {
      element.removeAttribute('data-processing');
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
    // 清空翻译缓存
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

  async detectPageLanguage() {
    try {
      // 先检查是否设置了不再提示
      const { hideUniversalAdapterTip } = await chrome.storage.sync.get(['hideUniversalAdapterTip']);
      if (hideUniversalAdapterTip) {
        return;
      }

      // 使用通用适配器的选择器获取所有可能需要翻译的元素
      const defaultAdapter = window.siteAdapters.getSiteAdapter('Default');
      if (!defaultAdapter) return;
      
      const elements = this.getTranslatableElements(defaultAdapter);
      if (elements.length === 0) return;

      let nonTargetLangCount = 0;
      let totalValidElements = 0;

      // 遍历元素检查语言
      for (const element of elements) {
        const text = element.textContent.trim();
        if (!text) continue;  // 跳过空文本

        totalValidElements++;
        if (!this.translationService.isTargetLanguage(text)) {
          nonTargetLangCount++;
        }
      }

      // 计算非目标语言的比例
      if (totalValidElements > 0) {
        const nonTargetLangRatio = nonTargetLangCount / totalValidElements;
        if (nonTargetLangRatio > 0.8) {
          const { theme = 'dark' } = await chrome.storage.sync.get(['theme']);
          this.showEnableUniversalAdapterTip(this.themes[theme] || this.themes.dark);
        }
      }
    } catch (error) {
      console.error('检测页面语言失败:', error);
    }
  }

  showEnableUniversalAdapterTip(currentTheme) {
    // 创建提示框
    const tipContainer = document.createElement('div');
    tipContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px;
      background-color: ${currentTheme.styles.backgroundColor};
      border: 1px solid ${currentTheme.styles.borderLeftColor};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      z-index: 999999;
      max-width: 300px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: ${currentTheme.styles.color};
      animation: slideIn 0.3s ease-out;
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // 根据目标语言选择提示文案
    const messages = {
      'zh-CN': '检测到当前页面可能需要翻译，但您未设置"启用通用适配"。您可以在BiLangPage的设置中启用通用适配器来开启翻译。',
      'ja': '現在のページは翻訳が必要かもしれませんが、「汎用アダプターを有効にする」が設定されていません。BiLangPageの設定で汎用アダプターを有効にして翻訳を開始できます。',
      'ko': '현재 페이지는 번역이 필요할 수 있지만 "범용 어댑터 활성화"가 설정되지 않았습니다. BiLangPage 설정에서 범용 어댑터를 활성화하여 번역을 시작할 수 있습니다.',
      'ar': 'قد تحتاج هذه الصفحة إلى الترجمة، ولكن لم يتم تعيين "تمكين المحول العام". يمكنك تفعيل المحول العام في إعدادات BiLangPage لبدء الترجمة.',
      'en': 'This page may need translation, but "Enable Universal Adapter" is not set. You can enable the universal adapter in BiLangPage settings to start translation.'
    };

    const closeButtonText = {
      'zh-CN': '不再提示',
      'ja': '今後表示しない',
      'ko': '다시 표시하지 않음',
      'ar': 'لا تظهر مرة أخرى',
      'en': 'Don\'t show again'
    };

    const targetLang = this.translationService.targetLang;
    const message = messages[targetLang] || messages['en'];
    const closeText = closeButtonText[targetLang] || closeButtonText['en'];

    // 提示内容
    tipContainer.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="
          font-weight: 500;
          font-size: 16px;
        ">BiLangPage</span>
      </div>
      <div style="margin-bottom: 12px;">
        ${message}
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button id="closeTip" style="
          padding: 6px 12px;
          border: 1px solid ${currentTheme.styles.borderLeftColor};
          border-radius: 4px;
          background-color: ${currentTheme.styles.backgroundColor};
          cursor: pointer;
          color: ${currentTheme.styles.color};
        ">${closeText}</button>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(tipContainer);

    // 添加关闭按钮事件监听
    document.getElementById('closeTip').addEventListener('click', async () => {
      // 保存不再提示的设置
      await chrome.storage.sync.set({ hideUniversalAdapterTip: true });
      tipContainer.remove();
    });

    // 10秒后自动关闭
    setTimeout(() => {
      if (document.body.contains(tipContainer)) {
        tipContainer.remove();
      }
    }, 10000);
  }
}

// 导出类
window.PageTranslator = PageTranslator; 