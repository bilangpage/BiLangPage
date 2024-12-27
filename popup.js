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

// 启用/禁用切换处理
document.getElementById('enableTranslation').addEventListener('change', async (event) => {
  const enabled = event.target.checked;
  await chrome.storage.sync.set({ enabled });
  // 通知内容脚本更新状态
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'toggleTranslation', enabled });
  }
});

// 语言切换处理
document.getElementById('targetLang').addEventListener('change', async (event) => {
  const targetLang = event.target.value;
  await chrome.storage.sync.set({ targetLang });
});

// 主题切换处理
document.getElementById('theme').addEventListener('change', async (event) => {
  const theme = event.target.value;
  await chrome.storage.sync.set({ theme });
});

// 初始化选中值
chrome.storage.sync.get(['targetLang', 'theme', 'enabled'], (result) => {
  if (result.targetLang) {
    document.getElementById('targetLang').value = result.targetLang;
  }
  if (result.theme) {
    document.getElementById('theme').value = result.theme;
  }
  // 设置启用/禁用状态
  document.getElementById('enableTranslation').checked = result.enabled !== false;
}); 