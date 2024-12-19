# BiLangPage

Copyright (C) 2024 BiLangPage  
Author: wujiuye <wujiuye99@gmail.com>  
Repository: https://github.com/wujiuye/bilangpage

Licensed under GNU Affero General Public License v3.0

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.

BiLangPage is a Chrome extension that provides instant bilingual translations for popular websites while preserving the original layout and user experience.

[中文文档](./README.zh-CN.md)

## Features

- 🌐 Real-time translation powered by Google Translate API
- 🎨 Multiple theme options for translated text
- 🚀 Fast and responsive with dynamic content
- 🔄 Automatic language detection
- 💫 Site-specific adapters for optimal experience
- 🆓 Completely free and open source

## Supported Websites

- Reddit: Posts, comments, and community content
- X (Twitter): Tweets and conversations
- Product Hunt: Product descriptions and discussions
- Quora: Questions, answers, and comments
- Medium: Articles, stories, and responses

More websites coming soon!

## Why Site-Specific?

While a universal translation solution might seem appealing, we've chosen a site-specific approach to ensure the best possible user experience. Each website has its unique structure and dynamic content loading patterns. By creating custom adapters for each supported site, we can:

- ✓ Precisely identify and translate the content you care about
- ✓ Maintain the original site's functionality and layout
- ✓ Handle dynamic content loading seamlessly
- ✓ Avoid interfering with interactive elements
- ✓ Provide consistent translation placement across different pages

## Installation

1. Visit [Chrome Web Store](https://chromewebstore.google.com/detail/bilangpage/ecglmijmieonanjgfojbcapmkgpahhil)
2. Click "Add to Chrome"
3. Choose your preferred language and theme in the extension popup

## Development

### Prerequisites

- Chrome browser

### Setup

1. Clone the repository:

```bash
git clone https://github.com/wujiuye/bilangpage.git
cd bilangpage
```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project directory

### Project Structure

```
bilangpage/
├── manifest.json       # Extension manifest
├── content.js         # Content script
├── popup.html         # Extension popup
├── popup.js          # Popup logic
├── background.js     # Background script
└── src/
    └── sites/        # Site-specific adapters
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have suggestions, please:

1. Search existing [Issues](https://github.com/wujiuye/bilangpage/issues)
2. Create a new issue if needed

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
