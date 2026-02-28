# Image Stitcher / 图片拼接工具

A Tampermonkey userscript for extracting and stitching images from web pages into a single long image.

一个油猴脚本，用于从网页中提取图片并拼接成一张长图。

---

## 中文说明

### 功能特点

- 🖼️ **智能提取**：自动识别 `<img>` 标签和 CSS 背景图片
- 📐 **无缝拼接**：图片按从上到下、从左到右顺序排列，无间隙拼接
- ✅ **多选支持**：可选择多个区域，合并提取图片
- 🎯 **精确选择**：按修饰键锁定选择，避免误操作
- 💾 **一键下载**：拼接完成后可直接下载 PNG 图片
- 🌐 **跨域支持**：自动处理跨域图片加载问题

### 安装方法

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击扩展图标 → 添加新脚本
3. 将 `image-stitcher.user.js` 的内容粘贴并保存
4. 刷新目标网页

### 使用方法

1. **启动工具**：点击页面右上角的 📐 按钮
2. **选择元素**：
   - 移动鼠标，蓝色框显示当前悬停元素
   - 按 `⌘`（Mac）或 `Alt`（Windows）将元素的父元素加入选择列表（绿色框）
   - 可重复此操作选择多个区域
3. **确认选择**：点击鼠标左键确认
4. **查看结果**：拼接完成后弹出预览窗口
5. **下载图片**：点击「下载图片」按钮保存

### 快捷键

| 按键 | 功能 |
|------|------|
| `⌘` / `Alt` | 将当前元素的父元素加入选择列表 |
| `ESC` | 取消选择模式 |
| 鼠标左键 | 确认选择 |

### 注意事项

- 选择时会自动获取悬停元素的**父元素**，以更好地包含子图片
- 相同 URL 的图片会自动去重
- SVG 占位图会被自动过滤

---

## English Documentation

### Features

- 🖼️ **Smart Extraction**: Automatically identifies `<img>` tags and CSS background images
- 📐 **Seamless Stitching**: Images arranged from top to bottom, left to right, with no gaps
- ✅ **Multi-selection Support**: Select multiple regions to merge extracted images
- 🎯 **Precise Selection**: Lock selection with modifier keys to avoid accidental clicks
- 💾 **One-click Download**: Download the stitched PNG image directly after completion
- 🌐 **Cross-origin Support**: Automatically handles cross-origin image loading

### Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click the extension icon → Add new script
3. Paste the content of `image-stitcher.user.js` and save
4. Refresh the target webpage

### Usage

1. **Launch Tool**: Click the 📐 button in the top-right corner
2. **Select Elements**:
   - Move your mouse, the blue box shows the current hovered element
   - Press `⌘` (Mac) or `Alt` (Windows) to add the element's parent to the selection list (green box)
   - Repeat this operation to select multiple regions
3. **Confirm Selection**: Click the left mouse button to confirm
4. **View Result**: A preview window appears after stitching is complete
5. **Download Image**: Click the "Download Image" button to save

### Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `⌘` / `Alt` | Add current element's parent to selection list |
| `ESC` | Cancel selection mode |
| Left Click | Confirm selection |

### Notes

- The **parent element** of the hovered element is automatically selected to better contain child images
- Duplicate images with the same URL are automatically removed
- SVG placeholder images are automatically filtered

---

## License

MIT License
