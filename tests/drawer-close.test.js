const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'http://localhost',
  beforeParse(window) {
    window.structuredClone = structuredClone;
  }
});
const { document } = dom.window;

const btnHamburger = document.getElementById('btnHamburger');
const drawer = document.getElementById('drawer');
const closeBtn = document.getElementById('drawerCloseBtn');

btnHamburger.click();
if (!drawer.classList.contains('open')) {
  throw new Error('Drawer did not open after clicking hamburger');
}

closeBtn.click();
if (drawer.classList.contains('open')) {
  throw new Error('Drawer did not close after clicking close button');
}

console.log('Drawer close button successfully closes menu');

