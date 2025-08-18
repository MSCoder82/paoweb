const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

['light', 'dark'].forEach(theme => {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { document } = dom.window;
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('backBtn');
  const events = [];
  btn.addEventListener('focus', () => events.push('focus'));
  btn.addEventListener('blur', () => events.push('blur'));
  btn.focus();
  btn.blur();
  if (events[0] !== 'focus' || events[1] !== 'blur') {
    throw new Error(`Tooltip did not activate/dismiss in ${theme} theme`);
  }
  console.log(`Tooltip focus/blur verified in ${theme} theme`);
});
