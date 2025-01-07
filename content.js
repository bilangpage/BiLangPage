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

// 等待站点适配器加载并初始化
async function initialize() {
  // 检查 siteAdapters 是否已经加载
  if (!window.siteAdapters?.getSiteAdapter) {
    // 等待站点适配器加载完成
    window.addEventListener('siteAdaptersLoaded', initialize, { once: true });
    return;
  }

  try {
    const { targetLang } = await chrome.storage.sync.get(['targetLang']);
    const translator = new TranslationService(targetLang || 'zh-CN');
    
    // 初始化划词翻译器
    new SelectionTranslator(translator, themes);
    
    // 初始化页面翻译器
    const pageTranslator = new PageTranslator(translator, themes);
    await pageTranslator.initialize();
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
