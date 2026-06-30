/**
 * Pomodoro Timer Launcher
 * Opens index.html in a frameless Chrome window for a native desktop feel.
 *
 * Usage: node launcher.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const htmlPath = path.join(__dirname, 'index.html');
// Convert to file:// URL (forward slashes, properly encoded)
const fileUrl = 'file:///' + htmlPath.split(path.sep).join('/');

// Try multiple Chrome paths
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
];

let chromePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    chromePath = p;
    break;
  }
}

if (!chromePath) {
  console.error('未找到 Chrome 浏览器。请安装 Chrome 后重试。');
  console.log('提示：你也可以直接在浏览器中打开 index.html 文件。');
  process.exit(1);
}

// --app mode: frameless window (no address bar, no tabs, no bookmarks)
const cmd = `"${chromePath}" --app="${fileUrl}" --window-size=440,680`;

console.log('🚀 启动番茄钟...');
console.log(`   Chrome: ${chromePath}`);
console.log(`   页面:   ${fileUrl}`);

const proc = exec(cmd, (err) => {
  if (err) {
    console.error('启动失败:', err.message);
    process.exit(1);
  }
});

proc.on('close', () => {
  console.log('番茄钟已关闭。');
});
