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

// 更新界面文本语言
function updateUILanguage(targetLang) {
  // 获取所有需要翻译的标签
  const labels = {
    'enableTranslationLabel': {
      'zh-CN': '启用翻译',
      'zh-TW': '啟用翻譯',
      'en': 'Enable Translation',
      'ja': '翻訳を有効にする',
      'ko': '번역 활성화',
      'fr': 'Activer la traduction',
      'de': 'Übersetzung aktivieren',
      'es': 'Activar traducción',
      'ar': 'تفعيل الترجمة'
    },
    'targetLanguageLabel': {
      'zh-CN': '目标语言',
      'zh-TW': '目標語言',
      'en': 'Target Language',
      'ja': '対象言語',
      'ko': '대상 언어',
      'fr': 'Langue cible',
      'de': 'Zielsprache',
      'es': 'Idioma objetivo',
      'ar': 'اللغة المستهدفة'
    },
    'themeStyleLabel': {
      'zh-CN': '主题样式',
      'zh-TW': '主題樣式',
      'en': 'Theme Style',
      'ja': 'テーマスタイル',
      'ko': '테마 스타일',
      'fr': 'Style du thème',
      'de': 'Theme-Stil',
      'es': 'Estilo del tema',
      'ar': 'نمط المظهر'
    },
    'previewLabel': {
      'zh-CN': '主题预览',
      'zh-TW': '主題預覽',
      'en': 'Theme Preview',
      'ja': 'テーマプレビュー',
      'ko': '테마 미리보기',
      'fr': 'Aperçu du thème',
      'de': 'Theme-Vorschau',
      'es': 'Vista previa del tema',
      'ar': 'معاينة المظهر'
    },
    'previewOriginalText': {
      'zh-CN': '原文示例',
      'zh-TW': '原文示例',
      'en': 'Original Text',
      'ja': '原文サンプル',
      'ko': '원문 예시',
      'fr': 'Texte original',
      'de': 'Originaltext',
      'es': 'Texto original',
      'ar': 'النص الأصلي'
    },
    'previewTranslationText': {
      'zh-CN': '译文示例',
      'zh-TW': '譯文示例',
      'en': 'Translation Text',
      'ja': '訳文サンプル',
      'ko': '번역 예시',
      'fr': 'Texte traduit',
      'de': 'Übersetzter Text',
      'es': 'Texto traducido',
      'ar': 'النص المترجم'
    }
  };

  // 更新每个标签的文本
  for (const [id, translations] of Object.entries(labels)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = translations[targetLang] || translations['en'];
    }
  }

  // 更新预览文本
  const previewOriginal = document.querySelector('.preview-original');
  const previewTranslation = document.querySelector('.preview-translation');
  if (previewOriginal) {
    previewOriginal.textContent = labels['previewOriginalText'][targetLang] || labels['previewOriginalText']['en'];
  }
  if (previewTranslation) {
    previewTranslation.textContent = labels['previewTranslationText'][targetLang] || labels['previewTranslationText']['en'];
  }
}

// 语言切换处理
document.getElementById('targetLang').addEventListener('change', async (event) => {
  const targetLang = event.target.value;
  await chrome.storage.sync.set({ targetLang });
  // 更新界面语言
  updateUILanguage(targetLang);
});

// 更新主题预览
function updateThemePreview(theme) {
  const previewContainer = document.getElementById('themePreview');
  // 移除所有主题类
  previewContainer.className = 'theme-preview-container';
  // 添加新主题类
  previewContainer.classList.add(theme);
}

// 主题切换处理
document.getElementById('theme').addEventListener('change', async (event) => {
  const theme = event.target.value;
  await chrome.storage.sync.set({ theme });
  updateThemePreview(theme);
});

// 初始化选中值
chrome.storage.sync.get(['targetLang', 'theme', 'enabled'], (result) => {
  const targetLang = result.targetLang || 'zh-CN';
  if (targetLang) {
    document.getElementById('targetLang').value = targetLang;
    // 初始化界面语言
    updateUILanguage(targetLang);
  }
  if (result.theme) {
    document.getElementById('theme').value = result.theme;
    updateThemePreview(result.theme);
  } else {
    // 默认主题
    updateThemePreview('dark');
  }
  // 设置启用/禁用状态
  document.getElementById('enableTranslation').checked = result.enabled !== false;
}); 