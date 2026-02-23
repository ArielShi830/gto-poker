# 🃏 德州扑克GTO决策助手 - APP部署指南

## 📱 三种安装方式（选一种即可）

---

## 方式一：本地安装到手机（推荐，免费）

### 步骤1：生成图标
**Windows：**
```bash
双击运行 generate-icons.bat
```

**Mac/Linux：**
```bash
chmod +x generate-icons.sh
./generate-icons.sh
```

### 步骤2：本地预览
1. 在VS Code中安装 **Live Server** 插件
2. 右键 `index.html` → "Open with Live Server"
3. 记下显示的本地地址，如 `http://192.168.1.5:5500`

### 步骤3：手机安装（Android & iOS都支持）
**Android手机：**
1. 确保手机和电脑在同一WiFi下
2. 用Chrome浏览器打开上面的地址
3. 点击右上角菜单（三个点）
4. 选择 "添加到主屏幕" 或 "安装应用"
5. 完成安装，桌面会出现图标

**iPhone：**
1. 确保手机和电脑在同一WiFi下
2. 用Safari浏览器打开上面的地址
3. 点击底部分享按钮（方框加箭头）
4. 选择 "添加到主屏幕"
5. 点击"添加"，完成安装

### 步骤4：离线使用
安装后，即使没有网络也能正常使用！

---

## 方式二：生成APK（Android原生APP）

如果你想要真正的APK安装包，需要：

### 选项A：使用Capacitor（推荐）
```bash
# 安装Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化Capacitor
npx cap init GTO助手 com.gto.poker

# 添加Android平台
npm install @capacitor/android
npx cap add android

# 同步文件
npx cap sync

# 打开Android Studio
npx cap open android
```

然后在Android Studio中 Build → Generate Signed Bundle/APK

### 选项B：使用PWA Builder（在线工具）
1. 访问 https://www.pwabuilder.com/
2. 上传你的项目文件夹
3. 选择 "Android"
4. 下载生成的APK文件

---

## 方式三：在线部署（最简单，无需安装）

用Netlify快速部署，获得网址后直接在浏览器访问：

1. 访问 https://app.netlify.com/drop
2. 上传整个项目文件夹
3. 获得网址后，在手机浏览器打开
4. 按照方式三的步骤安装到主屏幕

---

## 📋 文件清单

确保你的文件夹包含以下文件：

```
GTO决策助手/
├── index.html          (主页面)
├── styles.css          (样式)
├── app.js              (应用逻辑)
├── poker.js            (扑克逻辑)
├── gto.js              (GTO策略)
├── manifest.json       (PWA配置 - 新增)
├── sw.js               (Service Worker - 新增)
├── icon-192.png        (192x192图标 - 生成后)
├── icon-512.png        (512x512图标 - 生成后)
├── generate-icons.bat  (Windows图标生成脚本)
└── generate-icons.sh   (Mac/Linux图标生成脚本)
```

---

## ⚠️ 常见问题

### Q1: 为什么"添加到主屏幕"选项没有出现？
**A:** 确保：
- 使用HTTPS或localhost访问（本地WiFi下的IP地址可以）
- manifest.json文件存在且正确
- 图标文件已生成

### Q2: iPhone上安装后打开还是网页，不是APP？
**A:** 这是PWA的特性，但体验和原生APP一样：
- 全屏显示（无浏览器地址栏）
- 有独立图标
- 可以离线使用
- 响应速度更快

### Q3: 想要上架应用商店怎么办？
**A:** 需要使用原生开发框架：
- Android: React Native / Flutter / Capacitor
- iOS: Swift / React Native / Flutter

这需要开发者账号（Android免费，iOS需付费）

---

## 🚀 推荐流程

**最快方案：**
1. 运行 `generate-icons.bat` 生成图标
2. Live Server启动本地服务
3. 手机浏览器打开并"添加到主屏幕"
4. **3分钟搞定！**

**长期使用方案：**
1. 部署到Netlify获得永久网址
2. 朋友直接访问网址安装
3. 无需传文件，分享链接即可

---

**有问题随时问我！**
