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
      'zh-CN': '翻译失败，可能是过于频繁被限制了。',
      'ja': '翻訳に失敗しました。頻繁な使用により制限されている可能性があります。',
      'ko': '번역 실패, 너무 빈번한 사용으로 제한되었을 수 있습니다.',
      'ar': 'فشلت الترجمة، قد تكون مقيدة بسبب الاستخدام المتكرر.',
      'en': 'Translation failed, might be restricted due to frequent use.',
    };

    // 初始化时探测 Google 翻译 API 是否可用
    this.isGoogleTranslateAvailable = false;
    this.detectGoogleTranslateAvailability();

    // Microsoft Translate token 相关
    this.msTranslateToken = null;
    this.msTokenTimer = null;
  }

  async detectGoogleTranslateAvailability() {
    try {
      const testText = "你好";
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&dt=ld&q=${encodeURIComponent(testText)}`;
      const response = await this.fetchWithTimeout(url, {}, 1000);
      if (!response.ok) {
        this.isGoogleTranslateAvailable = false;
        return;
      }
      const data = await response.json();
      const translatedText = data?.[0]?.[0]?.[0];
      this.isGoogleTranslateAvailable = translatedText?.toLowerCase() === 'hello';
      console.log("isGoogleTranslateAvailable:", this.isGoogleTranslateAvailable);
    } catch (error) {
      this.isGoogleTranslateAvailable = false;
      console.log("isGoogleTranslateAvailable:", this.isGoogleTranslateAvailable);
    }
  }

  async getMicrosoftToken() {
    // 如果已有token且定时器存在，直接返回token
    if (this.msTranslateToken && this.msTokenTimer) {
      return this.msTranslateToken;
    }

    try {
      // 获取新token
      const authResponse = await fetch('https://edge.microsoft.com/translate/auth');
      const authToken = await authResponse.text();

      // 保存token
      this.msTranslateToken = authToken;

      // 清除旧的定时器（如果存在）
      if (this.msTokenTimer) {
        clearTimeout(this.msTokenTimer);
      }

      // 设置新的定时器，15秒后清除token
      this.msTokenTimer = setTimeout(() => {
        this.msTranslateToken = null;
        this.msTokenTimer = null;
      }, 15000);

      return authToken;
    } catch (error) {
      console.error('Failed to get Microsoft token:', error);
      return null;
    }
  }

  async microsoftTranslate(text) {
    try {
      // 获取token（使用缓存机制）
      const authToken = await this.getMicrosoftToken();
      if (!authToken) {
        throw new Error('Failed to get Microsoft translation token');
      }

      // 使用token进行翻译请求
      const response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${this.targetLang}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-type': 'application/json',
        },
        body: JSON.stringify([{ text: text }])
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const detectedLang = data[0]?.detectedLanguage?.language;
      // 如果检测到的语言是目标语言，则直接返回原文
      if (detectedLang && this.targetLangMap[this.targetLang]?.includes(detectedLang)) {
        console.log(`Skipping translation based on API detection: ${detectedLang}`);
        return text;
      }

      return data[0]?.translations?.[0]?.text || '';
    } catch (error) {
      console.error('Microsoft translation error:', error);
      return this.errorMessages[this.targetLang] || this.errorMessages['en'];
    }
  }

  async translate(text) {
    if (!text.trim()) return '';

    // 如果原文是目标语言, 则直接返回原文
    if (this.isTargetLanguage(text)) {
      return text;
    }

    // 根据 Google 翻译 API 的可用性选择翻译服务
    if (this.isGoogleTranslateAvailable) {
      return this.googleTranslate(text);
    } else {
      return this.microsoftTranslate(text);
    }
  }

  async googleTranslate(text) {
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
      console.error('Google translation error:', error);
      // 如果 Google 翻译失败，尝试使用微软翻译
      this.isGoogleTranslateAvailable = false;
      return this.microsoftTranslate(text);
    }
  }

  isTargetLanguage(text) {
    let processedText = text;
    // 移除URL
    processedText = processedText.replace(/(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, '');
    // 移除无意义的标识符字符串
    processedText = processedText.replace(/\b(?:[a-z]+[_=]|[_=])[a-z0-9]{8,}\b/gi, '');  // 例如：access_a9radsad, token_12345678, =abcd12345
    processedText = processedText.replace(/\b[a-z]+[-_=][a-z0-9]{4,}[-_=][a-z0-9]{4,}\b/gi, '');  // 例如：user-a4f5-b9c2, api_token_123456
    processedText = processedText.replace(/\b[a-z0-9]{7,}(?:[_=][a-z0-9]{4,})+\b/gi, '');  // 例如：a7b8c9d0_efgh_ijkl, token123_abc4_xyz7
    // 移除邮箱地址
    processedText = processedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '');
    // 移除#标签
    processedText = processedText.replace(/#[\w\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]+/g, '');
    // 移除@提及
    processedText = processedText.replace(/@[\w\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]+/g, '');
    // 移除类似文件目录路径的文本
    processedText = processedText.replace(/(?:\/[\w-]+)+(?:\/[\w.-]+)*\/?/g, '');
    // 移除文件名（包含扩展名的文件）
    processedText = processedText.replace(/\b[\w-]+\.[a-zA-Z0-9]{1,6}\b/g, '');
    // 移除重复的无意义字符
    processedText = processedText.replace(/(.)\1{4,}/g, '');  // 连续重复5次以上的字符
    processedText = processedText.replace(/([^\w\s])\1+/g, '$1');  // 连续重复的标点符号
    // 移除品牌词、产品名、交互词等需要排除的词汇
    const allExcludes = [
      ...window.brandNames.companies,
      ...window.brandNames.products,
      ...window.brandNames.standards,
      ...window.interactions
    ];
    // 使用正则表达式替换品牌词和产品名（考虑大小写）
    for (const name of allExcludes) {
      const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      processedText = processedText.replace(regex, '');
    }
    // 使用产品型号匹配规则
    for (const pattern of window.brandNames.productPatterns) {
      processedText = processedText.replace(pattern.pattern, '');
    }

    // 移除所有表情符号、特殊字符、标点符号、数字和货币符号
    const cleanText = processedText
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')   // 移除表情符号
      .replace(/[\u{2700}-\u{27BF}]/gu, '')     // 移除装饰符号
      .replace(/[\u{1F000}-\u{1F02F}]/gu, '')   // 移除其他特殊符号
      .replace(/(?:USD|EUR|GBP|JPY|CNY|US\$|CN¥|€|£)\s*/gi, '') // 移除货币代码
      .replace(/[$¥€£¢₹₽₩₪₱]/g, '') // 移除货币符号
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()，。！？；：、／＼｜［］｛｝「」『』（）《》〈〉【】〔〕…‥]/g, '') // 移除标点符号（包括全角字符）
      .replace(/\d+\s*(?:[KkMmGgTt][Bb]|[KkMmGg])/g, '')  // 移除带数字的数据单位（如10k, 10M, 10GB）
      .replace(/\d+\s*(?:st|nd|rd|th|px|em|rem|%|°C|°F|kg|km|cm|mm|m²|m³|ms|s|h|d|w|y)/gi, '') // 移除带数字的计量单位
      .replace(/\d+/g, '')  // 移除剩余的数字
      .replace(/\s+/g, ''); // 移除空格

    // 如果目标语言是英语，使用单词和字符混合检测
    if (this.targetLang === 'en') {
      // 先找出所有英文单词（不包含数字）
      const englishWords = text.match(/[a-zA-Z]+[a-zA-Z\-']*/g) || [];
      // 移除所有英文单词，剩下的就是非英文内容
      const nonEnglishText = cleanText
        .replace(/[a-zA-Z]+[a-zA-Z\-']*/g, ''); // 移除英文单词
      // 计算比例：英文单词数 / (英文单词数 + 非英文字符数)
      const totalCount = englishWords.length + nonEnglishText.length;
      const ratio = totalCount === 0 ? 0 : englishWords.length / totalCount;
      return ratio > 0.35;
    }

    // 对于其他语言，使用字符检测逻辑
    const targetChars = this.getTargetLanguageChars();
    if (!targetChars) return true;
    if (cleanText.length === 0) return true;

    const targetCount = cleanText.split('').filter(char => targetChars.test(char)).length;
    const ratio = targetCount / cleanText.length;
    // 对于日语，需要特殊处理
    if (this.targetLang === 'ja') {
      // 检查是否包含平假名或片假名
      const hasKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(cleanText);
      // 如果包含假名，则认为是日语
      return hasKana;
    }
    // 对于中文，需要特殊处理日语
    if (this.targetLang === 'zh-CN') {
      const hasKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(cleanText);
      // 如果包含假名，则不是中文
      if (hasKana) {
        return false;
      }
    }
    return ratio >= 0.2;
  }

  getTargetLanguageChars() {
    switch (this.targetLang) {
      case 'zh-CN':
        return /[\u4e00-\u9fa5]/;  // 简体中文汉字
      case 'ja':
        // 日语检测需要更精确：
        // 1. 平假名 (\u3040-\u309F)
        // 2. 片假名 (\u30A0-\u30FF)
        // 3. 日文标点和符号 (\u3000-\u303F)
        // 注意：不再包含汉字范围，因为这会导致与中文混淆
        return /[\u3040-\u309F\u30A0-\u30FF\u3000-\u303F]/;
      case 'ko':
        return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
      case 'ar':
        return /[\u0600-\u06FF]/;
      case 'en':
        return /[a-zA-Z]/;
      default:
        return null;
    }
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

  setTargetLang(targetLang) {
    this.targetLang = targetLang;
  }
}

// 导出类
window.TranslationService = TranslationService; 