/**
 * Pomodoro Timer - Local HTTP Server
 *
 * Serves the app on localhost so Chrome can trigger PWA installation.
 * PWA install requires HTTPS or localhost: file:// won't trigger it.
 *
 * Usage: node server.js [port]
 * Default port: 8765
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.argv[2]) || 8765;
const ROOT = __dirname;
const APP_URL = `http://localhost:${PORT}`;

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// Create server
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  let urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Prevent directory traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
      return;
    }

    // manifest.json must be served as application/manifest+json for PWA
    const ext = path.extname(filePath).toLowerCase();
    const isManifest = filePath.endsWith('manifest.json') || safePath.endsWith('.webmanifest');
    const contentType = isManifest ? 'application/manifest+json' : (MIME[ext] || 'application/octet-stream');

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

// Start
server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  🍅  番茄钟服务已启动');
  console.log(`  📍  ${APP_URL}`);
  console.log('');
  console.log('  💡 在 Chrome 中打开上述地址');
  console.log('     地址栏右侧会出现安装图标 ⊕');
  console.log('     点击即可安装为桌面应用！');
  console.log('');
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});

// Auto-open Chrome
function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const chromePath = findChrome();
if (chromePath) {
  setTimeout(() => {
    exec(`"${chromePath}" "${APP_URL}" --window-size=460,700`, (err) => {
      if (err) console.log('  ⚠ 自动打开浏览器失败，请手动打开上述地址。');
    });
  }, 800);
}
