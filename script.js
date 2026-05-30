// 复制链接功能 (增强反馈)
function copyText(id, btn) {
    const textElement = document.getElementById(id);
    if (!textElement) return;
    const text = textElement.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        btn.style.background = "#10b981";
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = "#2b5efb";
        }, 1500);
    }).catch(() => {
        alert("❌ 复制失败，请手动复制");
    });
}

// 核心：通过正则从 XAML 文本中提取版本号（格式如 “版本 0.7.7”）
function extractVersionFromXaml(xamlText) {
    // 匹配 Text="版本 0.7.7"  或者 Text='版本 0.7.7'  支持点号数字组合
    const regex = /Text=["']版本\s+([\d\.]+)["']/i;
    const match = xamlText.match(regex);
    if (match && match[1]) {
        return `版本 ${match[1]}`;
    }
    // 兼容更宽松的写法: 版本号可能直接跟在“版本”后没有空格
    const regexLoose = /Text=["']版本[\s]*([\d\.]+)["']/i;
    const matchLoose = xamlText.match(regexLoose);
    if (matchLoose && matchLoose[1]) {
        return `版本 ${matchLoose[1]}`;
    }
    // 最后尝试寻找“关于本页面”卡片区域内的版本数字（兜底）
    const aboutSection = xamlText.match(/关于本页面[\s\S]{0,500}版本\s+([\d\.]+)/i);
    if (aboutSection && aboutSection[1]) {
        return `版本 ${aboutSection[1]}`;
    }
    return null;
}

// 获取并显示版本号（带加载动画与重试）
const versionSpan = document.getElementById('versionDisplay');
const reloadBtn = document.getElementById('reloadVersionBtn');

async function fetchAndDisplayVersion() {
    if (!versionSpan) return;
    // 显示加载中动画
    versionSpan.innerHTML = '<i class="fas fa-circle-notch spinner-icon"></i> 获取中';
    versionSpan.style.opacity = '0.8';
    try {
        // 使用 fetch 获取同目录下 Server_Update/Custom.xaml
        const response = await fetch('./Server_Update/Custom.xaml', {
            cache: 'no-store',   // 防止缓存旧内容
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const xamlText = await response.text();
        const versionStr = extractVersionFromXaml(xamlText);
        if (versionStr) {
            versionSpan.innerHTML = versionStr;
            versionSpan.style.opacity = '1';
        } else {
            throw new Error('未匹配到版本号');
        }
    } catch (err) {
        console.warn('版本加载失败:', err);
        versionSpan.innerHTML = '<span style="color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> 获取失败</span>';
        versionSpan.style.opacity = '1';
        // 在版本容器旁添加短暂提示
        const container = document.querySelector('.version-zone');
        if (container && !container.querySelector('.version-error-tip')) {
            const tip = document.createElement('span');
            tip.className = 'version-error-tip';
            tip.style.fontSize = '11px';
            tip.style.marginLeft = '8px';
            tip.style.color = '#f97316';
            tip.innerHTML = '请检查网络或稍后重试';
            container.appendChild(tip);
            setTimeout(() => tip.remove(), 3000);
        }
    }
}

// 手动刷新（带旋转动画）
let isRefreshing = false;
async function manualRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;
    const reloadIcon = reloadBtn?.querySelector('i');
    if (reloadIcon) reloadIcon.classList.add('fa-spin');
    await fetchAndDisplayVersion();
    if (reloadIcon) reloadIcon.classList.remove('fa-spin');
    isRefreshing = false;
}

// 页面加载时自动获取版本
window.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayVersion();
    if (reloadBtn) {
        reloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            manualRefresh();
        });
    }
});