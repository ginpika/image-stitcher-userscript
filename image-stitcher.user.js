// ==UserScript==
// @name         图片拼接工具
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  选择父元素，提取图片并拼接成长图（支持多选）
// @author       ginpika
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isSelecting = false;
    let highlightedElement = null;
    let selectedElements = [];
    let overlay = null;
    let selectedHighlights = [];

    const styles = `
        .stitch-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.04),
                0 4px 8px rgba(0, 0, 0, 0.04),
                0 8px 16px rgba(0, 0, 0, 0.04);
            font-size: 20px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
        }
        .stitch-btn:hover {
            transform: translateY(-2px);
            box-shadow: 
                0 4px 8px rgba(0, 0, 0, 0.06),
                0 8px 16px rgba(0, 0, 0, 0.06),
                0 16px 32px rgba(0, 0, 0, 0.06);
            border-color: rgba(0, 0, 0, 0.12);
        }
        .stitch-btn:active {
            transform: translateY(0);
            box-shadow: 
                0 1px 2px rgba(0, 0, 0, 0.04),
                0 2px 4px rgba(0, 0, 0, 0.04);
        }
        .stitch-btn.active {
            background: #f0f7ff;
            border-color: #4285f4;
        }
        .stitch-tip {
            position: fixed;
            top: 76px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #333;
            padding: 12px 16px;
            border-radius: 12px;
            z-index: 2147483647;
            font-size: 13px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.04),
                0 4px 12px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 0, 0, 0.06);
            max-width: 280px;
            line-height: 1.5;
        }
        .stitch-highlight {
            position: fixed;
            pointer-events: none;
            z-index: 2147483646;
            box-sizing: border-box;
            border-radius: 4px;
        }
        .stitch-highlight-blue {
            background: rgba(66, 133, 244, 0.12);
            border: 2px solid #4285f4;
        }
        .stitch-highlight-green {
            background: rgba(52, 199, 89, 0.12);
            border: 2px solid #34c759;
        }
        .stitch-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .stitch-modal-content {
            background: #fff;
            border-radius: 16px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.12),
                0 32px 64px rgba(0, 0, 0, 0.16);
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        .stitch-modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        .stitch-modal-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .stitch-modal-actions {
            display: flex;
            gap: 8px;
        }
        .stitch-btn-action {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            transition: all 0.15s ease;
        }
        .stitch-btn-primary {
            background: #4285f4;
            color: white;
        }
        .stitch-btn-primary:hover {
            background: #3b78e7;
        }
        .stitch-btn-secondary {
            background: #f5f5f5;
            color: #666;
        }
        .stitch-btn-secondary:hover {
            background: #ebebeb;
        }
        .stitch-modal-body {
            padding: 24px;
            overflow: auto;
            flex: 1;
            min-height: 0;
        }
        .stitch-modal-body img {
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
    `;

    function injectStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    function createFloatButton() {
        const btn = document.createElement('div');
        btn.id = 'image-stitch-btn';
        btn.className = 'stitch-btn';
        btn.innerHTML = '📐';
        btn.title = '图片拼接工具';
        btn.onclick = toggleSelectionMode;
        document.body.appendChild(btn);
    }

    function toggleSelectionMode() {
        if (isSelecting) {
            exitSelectionMode();
        } else {
            enterSelectionMode();
        }
    }

    function enterSelectionMode() {
        isSelecting = true;
        selectedElements = [];
        selectedHighlights = [];
        const btn = document.getElementById('image-stitch-btn');
        if (btn) btn.classList.add('active');
        createOverlay();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('click', onSelectElement, true);
        document.addEventListener('keydown', onKeyDown);
        showTip('移动选择元素，按 ⌘/Alt 加入列表（绿色），点击确认，ESC 取消');
    }

    function exitSelectionMode() {
        isSelecting = false;
        selectedElements = [];
        const btn = document.getElementById('image-stitch-btn');
        if (btn) btn.classList.remove('active');
        removeOverlay();
        removeHighlight();
        removeAllSelectedHighlights();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('click', onSelectElement, true);
        document.removeEventListener('keydown', onKeyDown);
        hideTip();
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'image-stitch-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2147483646;
        `;
        document.body.appendChild(overlay);
    }

    function removeOverlay() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
    }

    function onMouseMove(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element !== highlightedElement) {
            highlightElement(element, false);
        }
    }

    function highlightElement(element, isSelected) {
        removeHighlight();
        highlightedElement = element;
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.id = 'image-stitch-highlight';
        highlight.className = `stitch-highlight ${isSelected ? 'stitch-highlight-green' : 'stitch-highlight-blue'}`;
        highlight.style.top = `${rect.top}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        document.body.appendChild(highlight);
    }

    function removeHighlight() {
        const highlight = document.getElementById('image-stitch-highlight');
        if (highlight) {
            highlight.remove();
        }
        highlightedElement = null;
    }

    function addSelectedHighlight(element) {
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.className = 'stitch-highlight stitch-highlight-green';
        highlight.style.top = `${rect.top}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        document.body.appendChild(highlight);
        selectedHighlights.push(highlight);
    }

    function removeAllSelectedHighlights() {
        selectedHighlights.forEach(h => h.remove());
        selectedHighlights = [];
    }

    function isElementSelected(element) {
        return selectedElements.includes(element);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            exitSelectionMode();
        } else if ((e.metaKey || e.altKey) && highlightedElement) {
            const parentEl = highlightedElement.parentElement;
            if (parentEl && !isElementSelected(parentEl)) {
                selectedElements.push(parentEl);
                addSelectedHighlight(parentEl);
                showTip(`已选择 ${selectedElements.length} 个区域，继续选择或点击确认`);
            }
        }
    }

    function onSelectElement(e) {
        e.preventDefault();
        e.stopPropagation();
        if (selectedElements.length > 0) {
            const elements = [...selectedElements];
            exitSelectionMode();
            processMultipleElements(elements);
        } else if (highlightedElement) {
            const parentEl = highlightedElement.parentElement || highlightedElement;
            exitSelectionMode();
            processElement(parentEl);
        }
    }

    function showTip(text) {
        let tip = document.getElementById('image-stitch-tip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'image-stitch-tip';
            tip.className = 'stitch-tip';
            document.body.appendChild(tip);
        }
        tip.textContent = text;
        tip.style.display = 'block';
    }

    function hideTip() {
        const tip = document.getElementById('image-stitch-tip');
        if (tip) {
            tip.style.display = 'none';
        }
    }

    function getAllImages(root) {
        const images = [];
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT,
            null
        );

        const elements = [];
        let node;
        while (node = walker.nextNode()) {
            elements.push(node);
        }

        elements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });

        for (const el of elements) {
            if (el.tagName === 'IMG') {
                const src = el.src || el.dataset.src;
                if (src && !src.startsWith('data:image/svg')) {
                    images.push({
                        element: el,
                        src: src,
                        rect: el.getBoundingClientRect()
                    });
                }
            } else if (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'A') {
                const bgImage = window.getComputedStyle(el).backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    const match = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
                    if (match && match[1]) {
                        images.push({
                            element: el,
                            src: match[1],
                            rect: el.getBoundingClientRect()
                        });
                    }
                }
            }
        }

        return images.filter((img, index, self) => 
            index === self.findIndex(i => i.src === img.src)
        );
    }

    async function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                const proxyImg = new Image();
                proxyImg.crossOrigin = 'anonymous';
                proxyImg.onload = () => resolve(proxyImg);
                proxyImg.onerror = reject;
                proxyImg.src = 'https://corsproxy.io/?' + encodeURIComponent(src);
            };
            img.src = src;
        });
    }

    async function processElement(element) {
        showTip('正在提取图片...');

        const images = getAllImages(element);
        
        if (images.length === 0) {
            hideTip();
            showTip('未找到图片！');
            setTimeout(hideTip, 2000);
            return;
        }

        showTip(`找到 ${images.length} 张图片，正在加载...`);

        const loadedImages = [];
        for (let i = 0; i < images.length; i++) {
            try {
                const img = await loadImage(images[i].src);
                loadedImages.push({
                    img: img,
                    info: images[i]
                });
                showTip(`正在加载图片 ${i + 1}/${images.length}...`);
            } catch (err) {
                console.warn('Failed to load image:', images[i].src);
            }
        }

        if (loadedImages.length === 0) {
            hideTip();
            showTip('所有图片加载失败！');
            setTimeout(hideTip, 2000);
            return;
        }

        showTip('正在拼接图片...');
        
        await stitchImages(loadedImages);
        hideTip();
    }

    async function processMultipleElements(elements) {
        showTip('正在提取图片...');

        let allImages = [];
        for (const element of elements) {
            const images = getAllImages(element);
            allImages = allImages.concat(images);
        }

        allImages = allImages.filter((img, index, self) => 
            index === self.findIndex(i => i.src === img.src)
        );
        
        if (allImages.length === 0) {
            hideTip();
            showTip('未找到图片！');
            setTimeout(hideTip, 2000);
            return;
        }

        showTip(`找到 ${allImages.length} 张图片，正在加载...`);

        const loadedImages = [];
        for (let i = 0; i < allImages.length; i++) {
            try {
                const img = await loadImage(allImages[i].src);
                loadedImages.push({
                    img: img,
                    info: allImages[i]
                });
                showTip(`正在加载图片 ${i + 1}/${allImages.length}...`);
            } catch (err) {
                console.warn('Failed to load image:', allImages[i].src);
            }
        }

        if (loadedImages.length === 0) {
            hideTip();
            showTip('所有图片加载失败！');
            setTimeout(hideTip, 2000);
            return;
        }

        showTip('正在拼接图片...');
        
        await stitchImages(loadedImages);
        hideTip();
    }

    async function stitchImages(images) {
        let totalHeight = 0;
        let maxWidth = 0;

        images.forEach(item => {
            totalHeight += item.img.naturalHeight;
            if (item.img.naturalWidth > maxWidth) {
                maxWidth = item.img.naturalWidth;
            }
        });

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');

        let currentY = 0;
        for (const item of images) {
            const img = item.img;
            const x = Math.round((maxWidth - img.naturalWidth) / 2);
            ctx.drawImage(img, x, Math.round(currentY), img.naturalWidth, img.naturalHeight);
            currentY += img.naturalHeight;
        }

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        showResult(dataUrl);
    }

    function showResult(dataUrl) {
        const existingModal = document.getElementById('image-stitch-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'image-stitch-modal';
        modal.className = 'stitch-modal';

        const content = document.createElement('div');
        content.className = 'stitch-modal-content';

        const header = document.createElement('div');
        header.className = 'stitch-modal-header';

        const title = document.createElement('span');
        title.className = 'stitch-modal-title';
        title.textContent = '图片拼接结果';

        const actions = document.createElement('div');
        actions.className = 'stitch-modal-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'stitch-btn-action stitch-btn-primary';
        downloadBtn.textContent = '下载图片';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `stitched-image-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'stitch-btn-action stitch-btn-secondary';
        closeBtn.textContent = '关闭';
        closeBtn.onclick = () => modal.remove();

        actions.appendChild(downloadBtn);
        actions.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(actions);

        const body = document.createElement('div');
        body.className = 'stitch-modal-body';

        const img = document.createElement('img');
        img.src = dataUrl;

        body.appendChild(img);
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            createFloatButton();
        });
    } else {
        injectStyles();
        createFloatButton();
    }
})();
