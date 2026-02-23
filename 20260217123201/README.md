# 德州扑克GTO决策助手 - 手机APP部署指南

## 方案一：PWA安装（推荐，最简单）

### Android 手机
1. 用Chrome浏览器打开网页
2. 等待底部弹出"安装GTO助手"提示
3. 点击"安装"即可添加到主屏幕
4. 或点击浏览器菜单 → "添加到主屏幕"

### iPhone/iPad
1. 用Safari浏览器打开网页
2. 点击底部分享按钮 ⎙
3. 选择"添加到主屏幕"
4. 点击"添加"

---

## 方案二：打包成APK（可分发安装）

### 方法A：使用PWABuilder（推荐）

1. **先部署到服务器**
   - 可以用 GitHub Pages、Vercel、Netlify 等免费托管
   - 或使用本地服务器

2. **使用PWABuilder打包**
   - 访问 https://pwabuilder.com
   - 输入你的网站URL
   - 点击"Start"进行分析
   - 选择"Android" → "Generate"
   - 下载APK文件
   - 直接安装到手机即可

### 方法B：使用AppsGeyser（更简单）

1. 访问 https://appsgeyser.com
2. 选择"Create App" → "Website"
3. 输入网站URL
4. 填写应用名称等信息
5. 生成并下载APK

### 方法C：本地打包（需要技术背景）

需要安装 Node.js 和 Android SDK

```bash
# 安装 Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化
npx cap init "GTO助手" com.gto.helper

# 添加Android平台
npx cap add android

# 复制网页文件到www目录
# 然后同步
npx cap sync

# 打开Android Studio
npx cap open android
```

---

## 方案三：GitHub Pages免费托管

1. 在GitHub创建仓库
2. 上传所有文件
3. Settings → Pages → 选择main分支
4. 几分钟后可访问 https://你的用户名.github.io/仓库名
5. 用这个URL进行PWA安装或PWABuilder打包

---

## 方案四：本地快速测试

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve

# 然后用手机浏览器访问 http://你的电脑IP:8080
```

---

## 文件清单

```
├── index.html      # 主页面
├── styles.css      # 样式文件
├── app.js          # 应用逻辑
├── poker.js        # 扑克牌计算
├── gto.js          # GTO决策算法
├── manifest.json   # PWA配置
├── sw.js           # Service Worker
├── icon-192.png    # 小图标
├── icon-512.png    # 大图标
└── icon.svg        # 矢量图标
```

---

## 功能特性

- 离线可用（PWA缓存）
- 6种风格策略（皇上/世伟/龙儿/嘉蔓/仕丞/李老师儿）
- 历史记录保存
- 翻前/翻后决策分析
- 胜率蒙特卡洛模拟

---

## 技术支持

如有问题，请检查：
1. 浏览器是否支持PWA（Chrome/Safari推荐）
2. 是否使用HTTPS（本地测试可用HTTP）
3. manifest.json路径是否正确
