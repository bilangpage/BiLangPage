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

class TranslationService {
  constructor(targetLang) {
    this.targetLang = targetLang;
    // 目标语言到语言检测代码的映射
    this.targetLangMap = {
      'zh-CN': ['zh-CN', 'zh'],
      'zh-TW': ['zh-TW', 'zh'],
      'ja': ['ja'],
      'ko': ['ko'],
      'ar': ['ar'],
      'en': ['en'],
      'fr': ['fr'],
      'de': ['de'],
      'es': ['es']
    };

    // 错误消息的多语言映射
    this.errorMessages = {
      'zh-CN': 'Google翻译接口今日被限制使用',
      'zh-TW': 'Google翻譯接口今日被限制使用',
      'ja': 'Google翻訳APIの今日の使用が制限されています',
      'ko': 'Google 번역 API가 오늘 사용이 제한되었습니다',
      'ar': 'واجهة برمجة ترجمة Google مقيدة اليوم',
      'en': 'Google Translate API is restricted today',
      'fr': "L'API Google Translate est restreinte aujourd'hui",
      'de': 'Die Google Translate API ist heute eingeschränkt',
      'es': 'La API de Google Translate está restringida hoy'
    };
  }

  async translate(text) {
    if (!text.trim()) return '';

    try {
      // 使用 Google API 进行检测和翻译
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.targetLang}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // 获取 API 检测到的语言
      const detectedLang = data?.[2] || null;

      // 跳过相同语言
      if (detectedLang && this.targetLangMap[this.targetLang]?.includes(detectedLang)) {
        console.log(`Skipping translation based on API detection: ${detectedLang}`);
        return '';
      }

      // 如果语言不匹配，使用翻译结果
      let translatedText = '';
      if (data && data[0]) {
        translatedText = data[0]
          .map(item => item[0])
          .filter(Boolean)
          .join(' ');
      }

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // 返回对应语言的错误提示
      return this.errorMessages[this.targetLang] || this.errorMessages['en'];
    }
  }
}

async function translateElements() {
  const { targetLang, theme = 'dark', enabled } = await chrome.storage.sync.get(['targetLang', 'theme', 'enabled']);
  // 如果禁用了翻译，直接返回
  if (enabled === false) {
    return;
  }

  if (!targetLang) {
    // 未找到目标语言设置，使用默认值：zh-CN
    await chrome.storage.sync.set({ targetLang: 'zh-CN' });
  }
  const translator = new TranslationService(targetLang || 'zh-CN');
  const currentTheme = themes[theme] || themes.dark;

  // 记录已翻译的文本内容，避免重复翻译
  const translatedTexts = new Set(
    Array.from(document.querySelectorAll('.bilingual-translation'))
      .map(el => el.getAttribute('data-original-text'))
  );

  // 获取当前网站的适配器
  const currentSite = window.siteAdapters.getSiteAdapter(window.location.hostname);
  if (!currentSite) {
    // 未找到当前网站的适配器
    return;
  }

  console.log(`Using ${currentSite.name} adapter`);

  // 获取所有需要翻译的元素
  const elements = currentSite.selectors.flatMap(selector => {
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

  console.log(`Found ${elements.length} elements to translate`);

  for (const element of elements) {
    try {
      // 跳过已翻译的元素
      if (!element.hasAttribute('data-translated') &&
        !element.nextElementSibling?.classList?.contains('bilingual-translation')) {
        const originalText = currentSite.processElement
          ? currentSite.processElement(element)
          : element.textContent.trim();

        if (originalText) {
          // 检查是否已经翻译过相同的文本
          if (translatedTexts.has(originalText)) {
            // 跳过已翻译的相同内容
            continue;
          }
          translatedTexts.add(originalText);

          const translatedText = await translator.translate(originalText);
          if (translatedText == "") {
            // 翻译失败或未翻译，跳过
            continue;
          }

          // 检查是否是 Reddit 的特定标题元素
          const isRedditTitle = window.location.hostname.includes('reddit.com') && 
            (element.matches('shreddit-post a[slot="title"]') || element.matches('h1[slot="title"]'));

          // 在插入翻译元素之前检查是否已经插入过了
          if (isRedditTitle) {
            // 对于 Reddit 标题，检查内部的翻译元素
            const existingTranslation = element.querySelector('.bilingual-translation');
            if (existingTranslation?.getAttribute('data-original-text') === originalText) {
              // 跳过已存在的翻译元素
              continue;
            }
          } else {
            // 对于其他元素，检查下一个兄弟元素
            const nextElement = element.nextElementSibling;
            if (nextElement?.classList?.contains('bilingual-translation') &&
              nextElement.getAttribute('data-original-text') === originalText) {
              // 跳过已存在的翻译元素
              continue;
            }
          }

          // 创建新的翻译元素
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
        }
      }
    } catch (error) {
      console.error(`处理元素时出错: ${error.message}`);
    }
  }
  console.log('Translation process completed');
}

// 添加防抖函数
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

// 使用防抖包装 translateElements
const debouncedTranslate = debounce(translateElements, 200);

// 在语言更改时的处理
chrome.storage.onChanged.addListener((changes) => {
  if (changes.targetLang || changes.theme) {
    console.log(`Language setting changed: ${changes.targetLang.oldValue} -> ${changes.targetLang.newValue}`);
    // 移除所有翻译
    const elements = document.querySelectorAll('[data-translated]');

    elements.forEach(el => {
      // 移除下一个元素（翻译文本）
      if (el.nextSibling && el.nextSibling.className === 'bilingual-translation') {
        // 移除翻译元素
        el.nextSibling.remove();
      }
      el.removeAttribute('data-translated');
    });
    // 重新翻译
    debouncedTranslate();
  }
});

// 等待站点适配器加载并初始化
function initialize() {
  // 检查 siteAdapters 是否已经加载
  if (!window.siteAdapters?.getSiteAdapter) {
    // 等待站点适配器加载完成
    window.addEventListener('siteAdaptersLoaded', initialize, { once: true });
    return;
  }

  // 创建翻译图标元素
  const translateIcon = document.createElement('div');
  translateIcon.className = 'bilingual-translate-icon';
  translateIcon.style.cssText = `
    position: absolute;
    display: none;
    width: 24px;
    height: 24px;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 999999;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230079d3"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>');
    background-size: 16px;
    background-repeat: no-repeat;
    background-position: center;
    transition: transform 0.2s ease;
  `;
  translateIcon.addEventListener('mouseenter', () => {
    translateIcon.style.transform = 'scale(1.1)';
  });
  translateIcon.addEventListener('mouseleave', () => {
    translateIcon.style.transform = 'scale(1)';
  });
  document.body.appendChild(translateIcon);

  // 创建翻译弹窗元素
  const translatePopup = document.createElement('div');
  translatePopup.className = 'bilingual-translate-popup';
  translatePopup.style.cssText = `
    position: absolute;
    display: none;
    max-width: 300px;
    padding: 12px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    font-size: 14px;
    line-height: 1.4;
    color: #000000;
  `;
  document.body.appendChild(translatePopup);

  // 检查选中文本是否在译文中
  function isSelectionInTranslation(selection) {
    if (!selection.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // 检查选中的文本节点
    if (container.nodeType === Node.TEXT_NODE) {
      return isElementTranslation(container.parentElement);
    }
    
    // 检查选中的元素节点
    return isElementTranslation(container);
  }

  // 检查元素是否是译文
  function isElementTranslation(element) {
    if (!element) return false;
    return (
      element.classList?.contains('bilingual-translation') ||
      element.classList?.contains('bilingual-translate-popup') ||
      element.closest('.bilingual-translation') !== null ||
      element.closest('.bilingual-translate-popup') !== null
    );
  }

  // 计算翻译图标位置
  function updateTranslateIconPosition(range) {
    const rect = range.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // 设置图标位置
    translateIcon.style.left = `${rect.right + scrollX + 10}px`;
    translateIcon.style.top = `${rect.top + scrollY}px`;
    translateIcon.style.display = 'block';

    // 如果弹窗已显示，同时更新弹窗位置
    if (translatePopup.style.display === 'block') {
      translatePopup.style.left = `${translateIcon.offsetLeft + 30}px`;
      translatePopup.style.top = `${translateIcon.offsetTop}px`;
    }
  }

  // 处理选中文本
  let selectedText = '';
  let selectionTimeout;
  let selectionEnabled = false;  // 默认禁用划词翻译

  // 初始化划词翻译状态
  chrome.storage.sync.get(['selectionEnabled'], (result) => {
    selectionEnabled = result.selectionEnabled === true;
  });

  // 监听划词翻译开关消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleSelection') {
      selectionEnabled = message.enabled;
      if (!selectionEnabled) {
        // 关闭划词翻译时，隐藏图标和弹窗
        translateIcon.style.display = 'none';
        translatePopup.style.display = 'none';
        selectedText = '';
      }
    }
  });

  // 处理双击事件
  document.addEventListener('dblclick', (e) => {
    if (!selectionEnabled) return;  // 如果禁用了划词翻译，直接返回

    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    // 如果选中的是译文，不显示翻译按钮
    if (!text || isSelectionInTranslation(selection)) {
      return;
    }

    selectedText = text;
    const range = selection.getRangeAt(0);
    updateTranslateIconPosition(range);
  });

  // 处理选择文本事件
  document.addEventListener('mouseup', (e) => {
    if (!selectionEnabled) return;  // 如果禁用了划词翻译，直接返回

    // 清除之前的定时器
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }

    // 设置新的定时器，延迟 200ms 处理选择
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // 如果选中的是译文，不显示翻译按钮
      if (!text || isSelectionInTranslation(selection)) {
        return;
      }

      if (text && text !== selectedText && !translatePopup.contains(e.target)) {
        selectedText = text;
        const range = selection.getRangeAt(0);
        updateTranslateIconPosition(range);
      } else if (!text) {
        // 如果没有选中文本，并且点击不在弹窗内，则隐藏图标和弹窗
        if (!translatePopup.contains(e.target) && !translateIcon.contains(e.target)) {
          translateIcon.style.display = 'none';
          translatePopup.style.display = 'none';
          selectedText = '';
        }
      }
    }, 200);
  });

  // 更新翻译图标样式
  function updateTranslateIconStyle(theme = 'dark') {
    const currentTheme = themes[theme] || themes.dark;
    translateIcon.style.backgroundColor = currentTheme.styles.backgroundColor;
    translateIcon.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
    
    // 更新 SVG 图标颜色
    const iconColor = currentTheme.styles.color.replace('#', '%23');
    translateIcon.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColor}"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>')`;
  }

  // 初始化翻译图标样式
  chrome.storage.sync.get(['theme'], (result) => {
    updateTranslateIconStyle(result.theme);
  });

  // 监听主题变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      updateTranslateIconStyle(changes.theme.newValue);
    }
  });

  // 点击翻译图标
  translateIcon.addEventListener('click', async () => {
    if (!selectedText) return;

    const { targetLang, theme = 'dark' } = await chrome.storage.sync.get(['targetLang', 'theme']);
    const translator = new TranslationService(targetLang || 'zh-CN');
    const currentTheme = themes[theme] || themes.dark;

    // 更新图标样式
    updateTranslateIconStyle(theme);

    // 显示加载状态
    translatePopup.textContent = '翻译中...';
    translatePopup.style.display = 'block';
    translatePopup.style.left = `${translateIcon.offsetLeft + 30}px`;
    translatePopup.style.top = `${translateIcon.offsetTop}px`;

    try {
      const translatedText = await translator.translate(selectedText);
      if (translatedText) {
        // 更新弹窗样式和内容
        translatePopup.style.cssText = `
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
          left: ${translateIcon.offsetLeft + 30}px;
          top: ${translateIcon.offsetTop}px;
        `;
        translatePopup.innerHTML = `
          <div style="
            margin-bottom: 12px; 
            opacity: 0.6; 
            font-size: 13px;
            padding-bottom: 8px;
            border-bottom: 1px solid ${currentTheme.styles.borderLeftColor}22;
          ">${selectedText}</div>
          <div style="
            border-left: 3px solid ${currentTheme.styles.borderLeftColor}; 
            padding-left: 8px;
          ">${translatedText}</div>
        `;
      }
    } catch (error) {
      translatePopup.textContent = '翻译失败，请稍后重试';
    }
  });

  // 点击页面其他地方关闭弹窗
  document.addEventListener('click', (e) => {
    if (!translatePopup.contains(e.target) && !translateIcon.contains(e.target)) {
      translateIcon.style.display = 'none';
      translatePopup.style.display = 'none';
      selectedText = '';
    }
  });

  // 滚动时更新图标和弹窗位置
  document.addEventListener('scroll', () => {
    // 滚动时直接关闭图标和弹窗
    translateIcon.style.display = 'none';
    translatePopup.style.display = 'none';
    selectedText = '';
  });

  // 初始化观察器
  const observer = new MutationObserver((mutations) => {
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
      debouncedTranslate();
    }
  });

  // 配置观察器
  const config = {
    childList: true,
    subtree: true
  };

  // 开始观察页面变化
  observer.observe(document.body, config);

  // 开始首次翻译
  debouncedTranslate();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  // 等待页面加载完成...
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // 页面已加载，开始初始化翻译
  initialize();
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggleTranslation') {
    if (!message.enabled) {
      // 禁用翻译时，移除所有翻译
      const translations = document.querySelectorAll('.bilingual-translation');
      translations.forEach(el => el.remove());
      
      // 移除所有已翻译标记
      const translatedElements = document.querySelectorAll('[data-translated]');
      translatedElements.forEach(el => el.removeAttribute('data-translated'));
    } else {
      // 重新启用时，执行翻译
      debouncedTranslate();
    }
  }
});
