const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html);
const select = dom.window.document.getElementById('su-role');
const options = Array.from(select.options).map(o => o.value);

if (options.length !== 3 || !options.includes('admin') || !options.includes('staff') || !options.includes('chief')) {
  throw new Error('Role dropdown must contain admin, staff, and chief');
}

console.log('Role dropdown contains admin, staff, and chief options');
