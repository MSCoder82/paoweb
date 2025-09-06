const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/function normalizeRole\(role\)\{[\s\S]*?\n\s*\}/);
if (!match) throw new Error('normalizeRole function not found');
const normalizeRole = new Function(match[0] + '; return normalizeRole;')();

if (normalizeRole('PAO Chief') !== 'chief' || normalizeRole('pao') !== 'chief') {
  throw new Error('normalizeRole should map "PAO" variations to "chief"');
}

console.log('normalizeRole handles PAO role strings');
