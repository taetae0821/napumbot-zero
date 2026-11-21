const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');
const scripts = ['data.js', 'art.js', 'game.js'].map(read).join('\n');
new (require('node:vm').Script)(scripts);
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#234cde"><meta name="description" content="엉뚱한 AI 납품봇의 사고를 고치며 배우는 공공조달 코미디 게임"><title>융통성 제로 AI 납품봇</title><style>${read('style.css')}</style></head>
<body><a class="skip" href="#app">게임으로 건너뛰기</a><div id="live" class="sr" aria-live="polite" aria-atomic="true"></div><header id="top"></header><main id="app" tabindex="-1"></main><footer id="footer"></footer><div id="overlay"></div><noscript>이 게임을 실행하려면 브라우저에서 JavaScript를 켜 주세요.</noscript><script>'use strict';\n${scripts.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`Built index.html (${Buffer.byteLength(html).toLocaleString()} bytes), no external dependencies.`);
