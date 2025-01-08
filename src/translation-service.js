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
      'ja': ['ja'],
      'ko': ['ko'],
      'ar': ['ar'],
      'en': ['en'],
    };

    this.errorMessages = {
      'zh-CN': 'Google翻译接口今日被限制使用',
      'ja': 'Google翻訳APIの今日の使用が制限されています',
      'ko': 'Google 번역 API가 오늘 사용이 제한되었습니다',
      'ar': 'واجهة برمجة ترجمة Google مقيدة اليوم',
      'en': 'Google Translate API is restricted today',
    };
  }

  isTargetLanguage(text) {
    let targetLangChars = 0;
    let totalChars = 0;
    
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0x2F || (code >= 0x3A && code <= 0x40) || 
          (code >= 0x5B && code <= 0x60) || (code >= 0x7B && code <= 0x7F)) {
        continue;
      }
      totalChars++;
      
      switch (this.targetLang) {
        case 'zh-CN':
          if ((code >= 0x4E00 && code <= 0x9FFF) ||
              (code >= 0x3400 && code <= 0x4DBF) ||
              (code >= 0x20000 && code <= 0x2A6DF) ||
              (code >= 0x2A700 && code <= 0x2B73F) ||
              (code >= 0x2B740 && code <= 0x2B81F) ||
              (code >= 0x2B820 && code <= 0x2CEAF) ||
              (code >= 0x2CEB0 && code <= 0x2EBEF)) {
            targetLangChars++;
          }
          break;
        case 'ja':
          if ((code >= 0x3040 && code <= 0x309F) ||
              (code >= 0x30A0 && code <= 0x30FF) ||
              (code >= 0x4E00 && code <= 0x9FFF) ||
              (code >= 0xFF66 && code <= 0xFF9F)) {
            targetLangChars++;
          }
          break;
        case 'ko':
          if ((code >= 0xAC00 && code <= 0xD7AF) ||
              (code >= 0x1100 && code <= 0x11FF) ||
              (code >= 0x3130 && code <= 0x318F)) {
            targetLangChars++;
          }
          break;
        case 'en':
          if ((code >= 0x41 && code <= 0x5A) ||
              (code >= 0x61 && code <= 0x7A) ||
              (code >= 0xC0 && code <= 0xFF && code !== 0xD7 && code !== 0xF7)) {
            targetLangChars++;
          }
          break;
        case 'ar':
          if (code >= 0x0600 && code <= 0x06FF) {
            targetLangChars++;
          }
          break;
        default:
          return false;
      }
    }
    
    const threshold = 0.35;
    // console.log(`Threshold: ${targetLangChars / totalChars}, TargetLangChars: ${targetLangChars}, TotalChars: ${totalChars} text: ${text}`);
    return totalChars > 0 && (targetLangChars / totalChars) > threshold;
  }

  async fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const signal = controller.signal;
 
    // 设置一个超时定时器
    const timeoutId = setTimeout(() => {
        controller.abort();
        throw new Error('Fetch request timed out');
    }, timeout);
 
    try {
        const response = await fetch(url, { ...options, signal });
        // 如果请求成功，清除定时器
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        // 如果请求被中断（超时或其他原因），清除定时器
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Fetch request aborted due to timeout');
        } else {
            throw error;
        }
    }
  }

  async translate(text) {
    if (!text.trim()) return '';

    // 如果原文是目标语言, 则直接返回原文
    if (this.isTargetLanguage(text)) {
      return text;
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${this.targetLang}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const detectedLang = data?.[2] || null;

      // 如果检测到的语言是目标语言，则直接返回原文
      if (detectedLang && this.targetLangMap[this.targetLang]?.includes(detectedLang)) {
        console.log(`Skipping translation based on API detection: ${detectedLang}`);
        return text;
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
      if (error.message == 'Failed to fetch' 
        || error.message === 'Fetch request aborted due to timeout' 
        || error.message === 'Fetch request timed out') {
        return "无法访问Google翻译api，请检查您的代理设置!";
      }
      console.error('Translation error:', error.message);
      return this.errorMessages[this.targetLang] || this.errorMessages['en'];
    }
  }

  setTargetLang(targetLang) {
    this.targetLang = targetLang;
  }
}

// 导出类
window.TranslationService = TranslationService; 