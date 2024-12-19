#!/bin/bash

# 创建构建目录
rm -rf dist
mkdir dist

# 复制必要文件
cp -r icons dist/
cp manifest.json dist/
cp popup.html dist/
cp popup.js dist/
cp background.js dist/
cp content.js dist/
cp -r src dist/
cp -r _locales dist/

# 创建 zip 文件
cd dist
zip -r ../bilangpage.zip .
cd ..

echo "Build completed! The extension package is available as bilangpage.zip" 