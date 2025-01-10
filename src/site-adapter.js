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
          // 帖子
          'article[data-testid="tweet"] div[lang] span', 
          // 通知
          'article[data-testid="notification"] div[lang] span',
          // 用户简介
          'div[data-testid="UserDescription"] span',
          // Who to Follow列表
          'button[data-testid="UserCell"] div[dir="auto"] span'
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
          'pre:not([class*=" "])'
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

  // 通用适配器
  'default': {
    name: 'Default',
    selectors: [
      {
        type: 'main-content',
        elements: [
          // 主要内容区域
          'main article p',
          'main article h1, main article h2, main article h3, main article h4',
          'main .content p',
          'main .post-content p',
          'main .article-content p',
          // 文章和段落
          'article p',
          '.post-content p',
          '.article-content p',
          '.entry-content p',
          '.content-area p',
          // 常见的文章容器
          'div[class*="article"] p',
          'div[class*="post"] p',
          'div[class*="content"] > p',
          // 博客内容
          '.blog-post p',
          '.blog-content p',
          // 文档类内容
          '.documentation p',
          '.docs-content p',
          // 主要区块内容
          'main p',
          'main li',
          '[role="main"] p',
          '[role="main"] li',
          // 产品和服务描述
          '.product-description p',
          '.service-description p',
          // 常见主要内容区域
          '#main-content p',
          '#content p',
          '.main-content p',
          // 标题内容
          'main h1, main h2, main h3',
          '#main-content h1, #main-content h2, #main-content h3',
          'article h1, article h2, article h3',
          '.content h1, .content h2, .content h3',
          // 列表内容
          'main ul li',
          'main ol li',
          'article ul li',
          'article ol li',
          '.content ul li',
          '.content ol li',
          // 详情页内容
          '.details p',
          '.detail-content p',
          // 信息区块
          '.info-block p',
          '.information p',
          // 描述文本
          '.description p',
          '[class*="description"] p',
          // 常见文本容器
          '[class*="text"] p',
          '[class*="body"] p',
          // 链接
          '#main-content a',
          'article a',
          '.content a',
          '.blog-post a',
          '.blog-content a',
          '.documentation a',
          '.docs-content a',
          '.main-content a',
          '.content-area a',
          '.entry-content a',
          '.post-content a',
          '.article-content a',
        ],
        exclude: [
          // 导航
          'nav',
          'header',
          '.navigation',
          '.nav',
          '.menu',
          '.navbar',
          '#navigation',
          '[role="navigation"]',
          // 侧边栏
          'aside',
          '.sidebar',
          '#sidebar',
          '[role="complementary"]',
          // 页脚
          'footer',
          '.footer',
          '#footer',
          '[role="contentinfo"]',
          '.entry-footer',
          // 评论区
          '.comments',
          '#comments',
          '.comment-section',
          // 广告
          '.ads',
          '.advertisement',
          '.banner',
          '.promo',
          // 按钮和交互元素
          'button',
          '.btn',
          '[role="button"]',
          '.button',
          // 面包屑
          '.breadcrumb',
          '.breadcrumbs',
          '[aria-label="breadcrumb"]',
          // 元数据
          '.meta',
          '.metadata',
          '.post-meta',
          // 社交分享
          '.share',
          '.social',
          '.social-media',
          // 作者信息
          '.author-info',
          '.bio',
          '.profile',
          // 相关内容
          '.related',
          '.recommended',
          '.suggestions',
          // 工具栏
          '.toolbar',
          '.tools',
          // 搜索区域
          '.search',
          '#search',
          '[role="search"]',
          // 标签
          '.tags',
          '.categories',
          // 弹窗
          '.modal',
          '.popup',
          // 通知
          '.notification',
          '.alert',
          // 购物车
          '.cart',
          '.basket',
          // 登录注册
          '.login',
          '.register',
          '.account',
          // 语言选择
          '.language-selector',
          '.lang-switch',
          // 版权信息
          '.copyright',
          '.legal',
          // 看不到的内容
          'script',
          'style',
          'noscript',
          'template',
          '[aria-hidden="true"]',
          '[hidden]',
          '[style*="display: none"]',
          '[style*="display:none"]',
          '[style*="visibility: hidden"]',
          '[style*="visibility:hidden"]',
          '[style*="opacity: 0"]',
          '[style*="opacity:0"]',
        ]
      }
    ],
    processElement: (element) => {
      // 检查元素是否在排除列表中
      const isExcluded = element.closest(
        siteAdapters.default.selectors[0].exclude.join(',')
      );
      if (isExcluded) return '';

      // 检查元素是否可见
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0' ||
          element.offsetParent === null) {
        return '';
      }

      // 检查是否是交互元素
      if (element.closest('button, input, select, textarea')) {
        return '';
      }

      // 递归获取可见文本内容
      function getVisibleText(node) {
        // 如果是文本节点，直接返回内容
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        // 如果不是元素节点，返回空字符串
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return '';
        }

        // 检查元素是否是需要排除的标签
        const tagName = node.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'template'].includes(tagName)) {
          return '';
        }

        // 检查元素是否有隐藏属性
        if (node.hasAttribute('hidden') || 
            node.getAttribute('aria-hidden') === 'true') {
          return '';
        }

        // 检查元素的样式
        const nodeStyle = window.getComputedStyle(node);
        if (nodeStyle.display === 'none' || 
            nodeStyle.visibility === 'hidden' || 
            nodeStyle.opacity === '0' ||
            node.offsetParent === null) {
          return '';
        }

        // 递归处理子节点
        let text = '';
        for (const childNode of node.childNodes) {
          text += getVisibleText(childNode);
        }
        return text;
      }

      // 获取所有可见文本
      const text = getVisibleText(element).trim();
      return text;
    }
  }
};

// 获取当前网站的适配器
function getSiteAdapter(hostname) {
  // 先尝试获取特定网站的适配器
  const specificAdapter = Object.entries(siteAdapters).find(([domain]) =>
    hostname.includes(domain) && domain !== 'default'
  )?.[1];

  // 如果没有特定适配器，返回通用适配器
  return specificAdapter || siteAdapters.default;
}

// 导出
window.siteAdapters = {
  getSiteAdapter,
  adapters: siteAdapters
};

// 触发初始化完成事件
window.dispatchEvent(new Event('siteAdaptersLoaded'));