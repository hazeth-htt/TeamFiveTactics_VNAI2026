const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace box shadows
content = content.replace(/0 12px 40px rgba\([^)]+\)/g, '0 2px 10px rgba(0,0,0,.05)');

// Replace border radii
content = content.replace(/borderRadius:\s*'32px'/g, "borderRadius: '20px'");
content = content.replace(/borderRadius:\s*'30px'/g, "borderRadius: '20px'");

fs.writeFileSync(file, content);
console.log('Styles updated.');
