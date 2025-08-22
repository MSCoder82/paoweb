const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html);
const select = dom.window.document.getElementById('su-role');
const options = Array.from(select.options).map(o => o.value);

if (options.includes('admin')) {
  throw new Error('Admin role should not be present in role dropdown');
}
if (options.length !== 2 || !options.includes('staff') || !options.includes('chief')) {
  throw new Error('Role dropdown must contain only staff and chief');
}

console.log('Role dropdown contains only staff and chief options');
