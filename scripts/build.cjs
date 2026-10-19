const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'style.css', 'app.js']) {
  fs.copyFileSync(path.join(source, name), path.join(output, name));
}
const read = name => fs.readFileSync(path.join(source, name), 'utf8');
const portable = read('index.html')
  .replace(/<link\s+rel="stylesheet"\s+href="style\.css"\s*\/?>/, () => '<style>' + read('style.css') + '</style>')
  .replace(/<script\s+src="app\.js"><\/script>/, () => '<script>' + read('app.js') + '</script>');
if (/href="style\.css"|src="app\.js"/.test(portable)) throw Error('Portable build failed to inline assets.');
fs.writeFileSync(path.join(output, 'SafeTown.html'), portable, 'utf8');
console.log('Built dist/ and dist/SafeTown.html');
