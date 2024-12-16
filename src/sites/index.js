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

// 网站适配器配置
const siteAdapters = {
  // Reddit 适配器
  'reddit.com': {
    name: 'Reddit',
    selectors: [
      {
        type: 'feed',
        // 注意：当前实现仅支持两层选择器，例如: "parent child"
        // 如需更深层的选择器，请使用 CSS 选择器字符串，例如：
        // "shreddit-feed > div > faceplate-screen-reader-content"
        elements: [
          'shreddit-feed faceplate-screen-reader-content'  // 两层选择器示例
        ]
      },
      {
        type: 'post',
        elements: [
          'shreddit-post h1',
          'shreddit-post p'
        ]
      },
      {
        type: 'comment',
        elements: [
          'shreddit-comment-tree p'
        ]
      }
    ],
    processElement: (element) => {
      return element.textContent.trim();
    }
  },
  
  // Twitter 适配器示例
  'x.com': {
    name: 'Twitter',
    selectors: [
      {
        type: 'tweet',
        // 对于复杂的选择器，建议使用标准的 CSS 选择器语法
        elements: [
          'article[data-testid="tweet"] div[lang] span',  // CSS 选择器示例
        ]
      }
    ]
  },

  // Product Hunt 适配器
  'producthunt.com': {
    name: 'Product Hunt',
    selectors: [
      {
        type: 'post',
        elements: [
            'main a[href^="/posts/"]',
            'main a[href^="/products/"]',
            'h1',
            'h2',
            'div[class^="styles_htmlText"]',
        ]
      }
    ]
  }

};

// 获取当前网站的适配器
function getSiteAdapter(hostname) {
  return Object.entries(siteAdapters).find(([domain]) => 
    hostname.includes(domain)
  )?.[1];
}

// 导出
window.siteAdapters = {
  getSiteAdapter,
  adapters: siteAdapters
}; 

// 触发初始化完成事件
window.dispatchEvent(new Event('siteAdaptersLoaded'));