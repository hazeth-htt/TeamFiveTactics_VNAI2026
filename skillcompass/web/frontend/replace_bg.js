const fs = require('fs');

const files = [
  'src/views/ProfileView.tsx',
  'src/views/ResultsView.tsx',
  'src/views/ChatView.tsx',
  'src/views/PreChatView.tsx',
  'src/views/MarketView.tsx',
  'src/app/page.tsx',
  'src/components/Nav.tsx',
  'src/views/HomeView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // We want to replace the page background which usually has '100vh' or 'sticky' in the same line or is the root wrapper.
  // ProfileView.tsx: Line 60: <div style={{ minHeight: '100vh', background: '#F5F5F5',
  content = content.replace(/minHeight: '100vh', background: '#F5F5F5'/g, "minHeight: '100vh', background: '#FAFAFA'");
  
  // ResultsView.tsx: Line 19: <div style={{ minHeight: '100vh', background: '#F5F5F5',
  
  // ChatView.tsx: Line 28: <div style={{ display: 'flex', height: '100vh', fontFamily: '"Google Sans Flex", sans-serif', background: '#F5F5F5' }}>
  content = content.replace(/height: '100vh', fontFamily: '"Google Sans Flex", sans-serif', background: '#F5F5F5'/g, 'height: \'100vh\', fontFamily: \'"Google Sans Flex", sans-serif\', background: \'#FAFAFA\'');
  
  // app/page.tsx: Line 28: <div style={{ fontFamily: '"Google Sans Flex", sans-serif', background: '#F5F5F5', minHeight: '100vh' }}>
  content = content.replace(/background: '#F5F5F5', minHeight: '100vh'/g, "background: '#FAFAFA', minHeight: '100vh'");
  
  // Nav.tsx: Line 7: <header style={{ padding: '24px 48px 0', background: '#F5F5F5', position: 'sticky'
  content = content.replace(/background: '#F5F5F5', position: 'sticky'/g, "background: '#FAFAFA', position: 'sticky'");
  
  fs.writeFileSync(file, content);
});

console.log("Background colors updated");
