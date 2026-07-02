const fs = require('fs');
const files = [
  'src/pages/PropertyDetails.jsx',
  'src/pages/AddProperty.jsx',
  'src/pages/Enquiry.jsx',
  'src/pages/MapPage.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/router\.push\(/g, 'navigate(');
  content = content.replace(/router\.back\(\)/g, 'navigate(-1)');
  content = content.replace(/navigate\.push\(/g, 'navigate(');
  content = content.replace(/navigate\.back\(\)/g, 'navigate(-1)');
  content = content.replace(/const router = useNavigate\(\);/g, 'const navigate = useNavigate();');
  content = content.replace(/<Link\s+href=/g, '<Link to=');
  fs.writeFileSync(file, content);
});
