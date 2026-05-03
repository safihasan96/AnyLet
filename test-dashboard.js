import fs from 'fs';
const code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');
const useEffectRegex = /useEffect\([\s\S]*?\}\, \[(.*?)\]\);/g;
let match;
while ((match = useEffectRegex.exec(code)) !== null) {
  console.log("Found useEffect dependencies:", match[1]);
}
