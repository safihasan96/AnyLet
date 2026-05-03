import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBbZiwo3yw0OMDqLJBX9THrSeF5R_djJQY",
    authDomain: "rentbd-e23ed.firebaseapp.com",
    projectId: "rentbd-e23ed",
    storageBucket: "rentbd-e23ed.firebasestorage.app",
    messagingSenderId: "52925845671",
    appId: "1:52925845671:web:6e00097d24753a0eaccb82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
    try {
        console.log("Checking 'properties'...");
        const propsSnap = await getDocs(collection(db, 'properties'));
        console.log(`- Total properties: ${propsSnap.size}`);
        
        let missingCreatedAt = 0;
        let unapproved = 0;
        let firstDoc = null;
        propsSnap.forEach(doc => {
            const data = doc.data();
            if (!("createdAt" in data)) missingCreatedAt++;
            if (data.isApproved === false) unapproved++;
            if (!firstDoc) firstDoc = data;
        });
        console.log(`- Properties missing 'createdAt': ${missingCreatedAt}`);
        console.log(`- Properties with isApproved=false: ${unapproved}`);
        if (firstDoc) {
            console.log(`- Sample Property 'createdAt':`, firstDoc.createdAt);
        }

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

checkData();
