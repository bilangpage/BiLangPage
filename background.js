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

// 获取默认目标语言
function getDefaultTargetLang() {
  // 获取浏览器的语言设置
  const browserLang = chrome.i18n.getUILanguage().toLowerCase();
  
  // 支持的语言映射
  const supportedLangs = {
    'zh': 'zh-CN',      // 中文
    'en': 'en',         // 英语
    'ja': 'ja',         // 日语
    'ko': 'ko',         // 韩语
    'ar': 'ar',         // 阿拉伯语
  };

  // 如果浏览器语言完全匹配，直接返回
  if (supportedLangs[browserLang]) {
    return supportedLangs[browserLang];
  }

  // 如果是中文的其他变体，返回简体中文
  if (browserLang.startsWith('zh-')) {
    return 'zh-CN';
  }

  // 获取语言的主要部分（例如 'en-US' -> 'en'）
  const mainLang = browserLang.split('-')[0];
  if (supportedLangs[mainLang]) {
    return supportedLangs[mainLang];
  }

  // 默认返回简体中文
  return 'zh-CN';
}

chrome.runtime.onInstalled.addListener(() => {
  // 设置默认值
  chrome.storage.sync.set({ 
    targetLang: getDefaultTargetLang(),
    theme: 'dark',
    enabled: true,
    enableUniversalAdapter: false,
    selectionEnabled: false
  });
}); 