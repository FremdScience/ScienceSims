const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const apps = [
  'plate-boundary-expedition',
  'watershed-under-pressure',
  'matter-under-pressure',
  'blackout-circuit-repair'
];

for (const app of apps) {
  const base = path.join(__dirname, '..', app);
  for (const file of ['index.html', 'styles.css', 'model.js', 'app.js', 'tests/model.test.js']) {
    assert.ok(fs.existsSync(path.join(base, file)), `${app} is missing ${file}`);
  }
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/gi)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${app} has duplicate HTML ids`);
  assert.match(html, /<html lang="en">/i, `${app} needs a page language`);
  assert.match(html, /name="viewport"/i, `${app} needs a viewport meta tag`);
  assert.match(html, /<title>[^<]+Fremd Science Simulations<\/title>/i, `${app} needs a descriptive title`);
  assert.match(html, /aria-live="polite"/i, `${app} needs an announced feedback region`);
  if (/<canvas\b/i.test(html)) assert.match(html, /<canvas[^>]+role="img"[^>]+aria-label=/i, `${app} canvases need text alternatives`);
  else assert.match(html, /id="circuit"[^>]+aria-label=/i, `${app} interactive stage needs a text label`);
  assert.match(html, /Model note|Safety and model note/i, `${app} needs a model limitation`);
  assert.doesNotMatch(html, /https?:\/\//i, `${app} should have no runtime network dependency`);
  assert.doesNotMatch(html, /\bname\s*=\s*["']student/i, `${app} must not request student names`);
  assert.doesNotMatch(html, /email|analytics|fetch\s*\(/i, `${app} must not transmit student data`);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/gi)) {
    const target = match[1];
    if (target === '../') continue;
    assert.ok(fs.existsSync(path.resolve(base, target)), `${app} has a broken local asset link: ${target}`);
  }
}

const hub = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const app of apps) assert.match(hub, new RegExp(`href="${app}/"`), `Hub does not link ${app}`);
console.log('New simulation static checks passed.');
