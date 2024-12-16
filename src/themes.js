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

const themes = {
  dark: {
    name: 'Dark',
    styles: {
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      borderLeftColor: '#4a4a4a'
    }
  },
  light: {
    name: 'Light',
    styles: {
      backgroundColor: '#ffffff',
      color: '#000000',
      borderLeftColor: '#0079d3'
    }
  },
  deepBlue: {
    name: 'Deep Blue',
    styles: {
      backgroundColor: '#1a365d',
      color: '#ffffff',
      borderLeftColor: '#2b4c7c'
    }
  },
  darkGrayOrange: {
    name: 'Dark Gray & Orange',
    styles: {
      backgroundColor: '#2D3748',
      color: '#ED8936',
      borderLeftColor: '#4A5568'
    }
  },
  brownYellow: {
    name: 'Brown & Yellow',
    styles: {
      backgroundColor: '#744210',
      color: '#F6E05E',
      borderLeftColor: '#975A16'
    }
  },
  almostBlackSkyBlue: {
    name: 'Almost Black & Sky Blue',
    styles: {
      backgroundColor: '#1A202C',
      color: '#63B3ED',
      borderLeftColor: '#2D3748'
    }
  },
  purpleYellow: {
    name: 'Purple & Yellow',
    styles: {
      backgroundColor: '#702459',
      color: '#FBBF24',
      borderLeftColor: '#8B2C5F'
    }
  },
  darkGreenLightGreen: {
    name: 'Dark Green & Light Green',
    styles: {
      backgroundColor: '#065F46',
      color: '#6EE7B7',
      borderLeftColor: '#047857'
    }
  },
  blackNeonGreen: {
    name: 'Black & Neon Green',
    styles: {
      backgroundColor: '#131516',
      color: '#70e000',
      borderLeftColor: '#2a2e30'
    }
  },
  mysticBlackSlateBlue: {
    name: 'Mystic Black & Slate Blue',
    styles: {
      backgroundColor: '#000000',
      color: '#6A5ACD',
      borderLeftColor: '#483D8B'
    }
  }
};

const defaultTheme = 'dark'; 