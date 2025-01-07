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
        type: 'post',
        elements: [
          'shreddit-post a[slot="title"]',
          'shreddit-post h1[slot="title"]',
          'shreddit-post div[slot="text-body"] p',
          'shreddit-post a[slot="text-body"] p'
        ]
      },
      {
        type: 'comment',
        elements: [
          'shreddit-comment-tree p',
          'shreddit-profile-comment p'
        ]
      },
      {
        type: 'community-information',
        elements: [
          'aside[aria-label="Community information"] div[id="description"]',
          'aside[aria-label="Community information"] div[class^="i18n-translatable-text"] div[class^="md"] p'
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
        elements: [
          'article[data-testid="tweet"] div[lang] span', 
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
  },

  // Quora 适配器
  'quora.com': {
    name: 'Quora',
    selectors: [
      {
        type: 'post',
        elements: [
          '#mainContent span.q-box.qu-userSelect--text span',
          '#mainContent span.q-box.qu-userSelect--text p span',
          '#mainContent div[class^="q-box"] div[class*="qu-bold"]',
          '#main_page_wrapper span.q-box.qu-userSelect--text span',
          '#main_page_wrapper span.q-box.qu-userSelect--text p span',
          '#main_page_wrapper div[class^="q-box"] div[class*="qu-bold"]',
        ]
      }
    ],
    processElement: (element) => {
      const text = element.textContent.trim();
      return text;
    }
  },

  // Medium 适配器
  'medium.com': {
    name: 'Medium',
    selectors: [
      {
        type: 'feed',
        elements: [
          'main h2',
          'main h3',
        ]
      },
      {
        type: 'article',
        elements: [
          'article h1',
          'article h2',
          'article h3',
          'article h4',
          'article h5',
          'article h6',
          'article p[class*="pw-post-body-paragraph"]',
          'article ul li',
          'article ol li',
        ]
      },
      {
        type: 'comment',
        elements: [
          'pre'
        ]
      }
    ]
  },

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