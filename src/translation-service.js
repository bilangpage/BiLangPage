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
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.targetLang}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const detectedLang = data?.[2] || null;

      if (detectedLang && this.targetLangMap[this.targetLang]?.includes(detectedLang)) {
        console.log(`Skipping translation based on API detection: ${detectedLang}`);
        return '';
      }

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
      return this.errorMessages[this.targetLang] || this.errorMessages['en'];
    }
  }

  setTargetLang(targetLang) {
    this.targetLang = targetLang;
  }
}

// 导出类
window.TranslationService = TranslationService; 