/*
 * BiLangPage - Bilingual Web Experience
 * https://github.com/wujiuye/bilangpage
 *
 * Copyright (C) 2024 BiLangPage
 * Author: wujiuye <wujiuye99@gmail.com>
 */

// 产品交互常用词
const interactions = [
  // 基础交互
  'Like',
  'Unlike',
  'Comment',
  'Reply',
  'Share',
  'Follow',
  'Unfollow',
  'Subscribe',
  'Unsubscribe',
  'Post',
  'Repost',
  'Forward',
  'Download',
  'Upload',
  'Save',
  'Delete',
  'Edit',
  'Report',
  'Block',
  'Mute',
  // 社交媒体常用
  'Tweet',
  'Retweet',
  'Pin',
  'Favorite',
  'Bookmark',
  'Tag',
  'Mention',
  'DM',
  // 内容互动
  'Upvote',
  'Downvote',
  'Rate',
  'Review',
  'Thumbs up',
  'Thumbs down',
  'React',
  'Love',
  'Wow',
  'Haha',
  'Sad',
  'Angry',
  // 代码仓库
  'Fork',
  'Clone',
  'Pull Request',
  'Merge',
  'Commit',
  'Branch',
  'Tag',
  'Issue',
  'Watch',
  'Star',
];

// 品牌词和产品名列表
const brandNames = {
  // 科技公司
  companies: [
    'Apple',
    'Google',
    'Microsoft',
    'Amazon',
    'Meta',
    'Tesla',
    'Intel',
    'AMD',
    'NVIDIA',
    'Samsung',
    'Sony',
    'LG',
    'Huawei',
    'Xiaomi',
    'OPPO',
    'VIVO',
    'OnePlus',
    'Lenovo',
    'Dell',
    'HP',
    'IBM',
    'Oracle',
    'Cisco',
    'Adobe',
    'Twitter',
    'LinkedIn',
    'TikTok',
    'ByteDance',
    'Tencent',
    'Alibaba',
    'Baidu'
  ],

  // 产品名
  products: [
    // 操作系统
    'iOS',
    'iPadOS',
    'macOS',
    'watchOS',
    'tvOS',
    'Android',
    'Windows',
    'Linux',
    'Ubuntu',
    'Debian',
    'CentOS',
    'RedHat',
    'Fedora',

    // 浏览器
    'Chrome',
    'Firefox',
    'Safari',
    'Edge',
    'Opera',

    // 编程语言和框架
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'Rust',
    'Go',
    'Swift',
    'Kotlin',
    'React',
    'Vue',
    'Angular',
    'Node.js',
    'Django',
    'Flask',
    'Spring',
    'Laravel',
    'Kubernetes',
    'Dockerfile',
    'Docker',
    'Docker Compose',
    'Git',
    'GitHub',
    'GitLab',

    // 设备和硬件
    'iPhone',
    'iPad',
    'MacBook',
    'iMac',
    'AirPods',
    'Apple Watch',
    'Galaxy',
    'Surface',
    'ThinkPad',
    'PlayStation',
    'Xbox',
    'Nintendo',
    'Switch',

    // 软件和应用
    'Photoshop',
    'Illustrator',
    'Word',
    'Excel',
    'PowerPoint',
    'Outlook',
    'Teams',
    'Slack',
    'Discord',
    'Zoom',
    'WeChat',
    'WhatsApp',
    'Telegram',
    'Signal',
    'Gmail',
    'YouTube',
    'Netflix',
    'Spotify',
    'Instagram',
    'Facebook',
    'Twitter',
    'LinkedIn',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'VS Code',
    'IntelliJ',
    'PyCharm',
    'WebStorm',
    'Xcode'
  ],

  // 技术标准和协议
  standards: [
    'HTTP',
    'HTTPS',
    'FTP',
    'SSH',
    'SSL',
    'TLS',
    'TCP',
    'IP',
    'DNS',
    'HTML',
    'CSS',
    'JSON',
    'XML',
    'REST',
    'GraphQL',
    'OAuth',
    'JWT',
    'WebSocket',
    'SMTP',
    'IMAP',
    'POP3',
    'API',
    'SDK',
    'CLI'
  ],

  // 产品型号匹配规则
  productPatterns: [
    // 手机型号
    {
      brand: 'iPhone',
      pattern: /iPhone\s*(?:1[1-9]|[1-9]\d)\s*(?:Pro\s*Max|Pro|Plus|mini)?/i
    },
    {
      brand: 'Xiaomi',
      pattern: /(?:Xiaomi|Redmi)\s*(?:[A-Z][0-9]|[0-9]+[A-Z]?|Note\s*[0-9]+|SU[0-9])/i
    },
    {
      brand: 'Huawei',
      pattern: /(?:Huawei|Honor)\s*(?:P[0-9]+|Mate\s*[0-9]+|Nova\s*[0-9]+)/i
    },
    {
      brand: 'Samsung',
      pattern: /(?:Samsung\s*)?Galaxy\s*(?:S[0-9]+|Note\s*[0-9]+|A[0-9]+|Z\s*(?:Fold|Flip)\s*[0-9])/i
    },
    {
      brand: 'OPPO',
      pattern: /OPPO\s*(?:Find\s*[A-Z][0-9]|Reno[0-9]|[A-Z][0-9])/i
    },
    {
      brand: 'VIVO',
      pattern: /VIVO\s*(?:X[0-9]+|Y[0-9]+|[A-Z][0-9]+)/i
    },
    // 笔记本型号
    {
      brand: 'MacBook',
      pattern: /MacBook\s*(?:Air|Pro)?\s*(?:1[1-9]|[1-9]\d)?(?:\s*inch)?/i
    },
    {
      brand: 'ThinkPad',
      pattern: /ThinkPad\s*(?:X1|T[0-9]+|X[0-9]+|P[0-9]+|E[0-9]+)/i
    },
    // 游戏机型号
    {
      brand: 'PlayStation',
      pattern: /PlayStation\s*[0-9]+|PS[0-9]+/i
    },
    {
      brand: 'Xbox',
      pattern: /Xbox\s*(?:One|Series\s*[SX])/i
    }
  ]
};

// 导出
window.brandNames = brandNames;
window.interactions = interactions; 