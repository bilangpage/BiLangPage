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
  }

  async translate(text) {
    if (!text.trim()) return '';

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.targetLang}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

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
      return error.message;
    }
  }
}

async function translateElements() {
  const { targetLang, theme = 'dark' } = await chrome.storage.sync.get(['targetLang', 'theme']);
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

          // 在插入翻译元素之前检查是否已经插入过了，通过这种方式来解决显示了重复翻译的问题
          // 检查是否已经存在相同的翻译元素
          const nextElement = element.nextElementSibling;
          if (nextElement?.classList?.contains('bilingual-translation') &&
            nextElement.getAttribute('data-original-text') === originalText) {
            // 跳过已存在的翻译元素
            continue;
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

          // 将翻译元素插入到原文后面
          element.parentNode.insertBefore(translationElement, element.nextSibling);

          // 标记原始元素已翻译
          element.setAttribute('data-translated', 'true');
        }
      } else {
        // 跳过已翻译的元素
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
