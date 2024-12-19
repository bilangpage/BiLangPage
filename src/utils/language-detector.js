/**
 * 语言检测工具
 */

// Unicode 字符范围定义
const UNICODE_RANGES = {
    // 中文字符范围
    zh: [
        [0x4E00, 0x9FFF],   // CJK统一汉字
        [0x3400, 0x4DBF],   // CJK统一汉字扩展A
        [0x20000, 0x2A6DF], // CJK统一汉字扩展B
        [0x2A700, 0x2B73F], // CJK统一汉字扩展C
        [0x2B740, 0x2B81F], // CJK统一汉字扩展D
        [0x2B820, 0x2CEAF], // CJK统一汉字扩展E
        [0x2CEB0, 0x2EBEF]  // CJK统一汉字扩展F
    ],
    // 日文字符范围（不包括汉字）
    ja: [
        [0x3040, 0x309F], // 平假名
        [0x30A0, 0x30FF], // 片假名
        [0x31F0, 0x31FF]  // 片假名语音扩展
    ],
    // 韩文字符范围
    ko: [
        [0xAC00, 0xD7AF], // 韩文音节
        [0x1100, 0x11FF], // 韩文字母
        [0x3130, 0x318F]  // 韩文兼容字母
    ],
    // 阿拉伯文字符范围
    ar: [
        [0x0600, 0x06FF], // 阿拉伯文
        [0x0750, 0x077F], // 阿拉伯文补充
        [0x08A0, 0x08FF], // 阿拉伯文扩展A
        [0xFB50, 0xFDFF], // 阿拉伯文表现形式A
        [0xFE70, 0xFEFF]  // 阿拉伯文表现形式B
    ],
    // 拉丁字母范围（英语、法语、德语等）
    latin: [
        [0x0020, 0x007F], // 基本拉丁字母
        [0x00A0, 0x00FF], // 拉丁字母-1补充
        [0x0100, 0x017F], // 拉丁字母扩展-A
        [0x0180, 0x024F]  // 拉丁字母扩展-B
    ]
};

/**
 * 检查字符是否在指定的Unicode范围内
 * @param {string} char 要检查的字符
 * @param {Array<Array<number>>} ranges Unicode范围数组
 * @returns {boolean}
 */
function isCharInRanges(char, ranges) {
    const code = char.charCodeAt(0);
    return ranges.some(([start, end]) => code >= start && code <= end);
}

/**
 * 获取字符串主要语言（占比超过80%的语言）
 * @param {string} text 要检测的文本
 * @returns {string|null} 返回语言代码或null（如果没有主要语言）
 */
function detectMainLanguage(text) {
    if (!text || typeof text !== 'string') return null;

    // 移除空格和标点符号
    const cleanText = text.replace(/[\s\p{P}]/gu, '');
    if (!cleanText) return null;

    const totalChars = cleanText.length;
    const threshold = totalChars * 0.8; // 80%阈值

    // 统计每种语言的字符数
    const langCounts = {
        zh: 0, ja: 0, ko: 0, ar: 0, latin: 0
    };

    // 遍历每个字符
    for (const char of cleanText) {
        for (const [lang, ranges] of Object.entries(UNICODE_RANGES)) {
            if (isCharInRanges(char, ranges)) {
                langCounts[lang]++;
                break;
            }
        }
    }

    // 检查是否有语言超过80%阈值
    for (const [lang, count] of Object.entries(langCounts)) {
        if (count >= threshold) {
            return lang;
        }
    }

    return null;
}

// 导出函数
export { detectMainLanguage }; 