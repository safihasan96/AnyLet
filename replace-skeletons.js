const fs = require('fs');

function replaceInFile(filePath, search, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(search)) {
        content = content.replace(search, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

function regexReplaceInFile(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath} (regex)`);
    }
}

// 1. App.jsx (PageLoader)
const appJsx = './src/App.jsx';
regexReplaceInFile(appJsx, /function PageLoader\(\) \{[\s\S]*?\n\}/, `import { PageSkeleton } from './components/Skeleton';\n\nfunction PageLoader() {\n  return <PageSkeleton />;\n}`);

// 2. AuthContext.jsx (LoadingScreen -> PageSkeleton)
const authCtx = './src/contexts/AuthContext.jsx';
replaceInFile(authCtx, `import LoadingScreen from '../components/LoadingScreen';`, `import { PageSkeleton as LoadingScreen } from '../components/Skeleton';`);

// 3. EditProfile.jsx
const editProfile = './src/pages/EditProfile.jsx';
replaceInFile(editProfile, `import { ArrowLeft, Save, Plus, X } from 'lucide-react';`, `import { ArrowLeft, Save, Plus, X } from 'lucide-react';\nimport { EditProfileSkeleton } from '../components/Skeleton';`);
replaceInFile(editProfile, `if (loading) return <div className="p-20 text-center animate-pulse text-[#3730a3]">Loading profile...</div>;`, `if (loading) return <EditProfileSkeleton />;`);

// 4. OwnerProfile.jsx
const ownerProfile = './src/pages/OwnerProfile.jsx';
replaceInFile(ownerProfile, `import PropertyLoader from '../components/PropertyLoader';`, `import { OwnerProfileSkeleton } from '../components/Skeleton';`);
regexReplaceInFile(ownerProfile, /if \(loading\) return \([\s\S]*?<\/div>\s*\);/, `if (loading) return <OwnerProfileSkeleton />;`);

// 5. PropertyDetails.jsx
const propertyDetails = './src/pages/PropertyDetails.jsx';
replaceInFile(propertyDetails, `import PropertyLoader from '../components/PropertyLoader';`, `import { PropertyDetailSkeleton } from '../components/Skeleton';`);
regexReplaceInFile(propertyDetails, /if \(loading\) return \([\s\S]*?<\/div>\s*\);/, `if (loading) return <PropertyDetailSkeleton />;`);

// 6. PropertyReviews.jsx & MyReviews.jsx
const propReviews = './src/pages/PropertyReviews.jsx';
replaceInFile(propReviews, `import PropertyLoader from '../components/PropertyLoader';`, `import { ReviewsSkeleton } from '../components/Skeleton';`);
regexReplaceInFile(propReviews, /if \(loading\) return \([\s\S]*?<\/div>\s*\);/, `if (loading) return <ReviewsSkeleton />;`);

const myReviews = './src/pages/MyReviews.jsx';
replaceInFile(myReviews, `import PropertyLoader from '../components/PropertyLoader';`, `import { ReviewsSkeleton } from '../components/Skeleton';`);
regexReplaceInFile(myReviews, /if \(loading\) return \([\s\S]*?<\/div>\s*\);/, `if (loading) return <ReviewsSkeleton />;`);

// 7. ReportProperty.jsx
const reportProp = './src/pages/ReportProperty.jsx';
replaceInFile(reportProp, `import PropertyLoader from '../components/PropertyLoader';`, `import { PageSkeleton } from '../components/Skeleton';`);
regexReplaceInFile(reportProp, /if \(loading\) return \([\s\S]*?<\/div>\s*\);/, `if (loading) return <PageSkeleton />;`);

// 8. Account.jsx (remove local ProfileSkeleton, import from Skeleton)
const accountJsx = './src/pages/Account.jsx';
regexReplaceInFile(accountJsx, /\/\*\s*SKELETON LOADER[\s\S]*?function ProfileSkeleton\(\) \{[\s\S]*?return \([\s\S]*?\);\n\}/, `import { ProfileSkeleton } from '../components/Skeleton';`);

