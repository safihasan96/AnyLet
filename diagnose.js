import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

// Using the config from the project's firebase.js
const firebaseConfig = {
  projectId: "rentbd-e23ed",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnose() {
  const reqs = [];
  const q = query(collection(db, 'viewing_requests'));
  const snap = await getDocs(q);
  
  snap.forEach(doc => {
    reqs.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Total viewing requests in DB: ${reqs.length}`);
  
  // Save to file for manual inspection
  fs.writeFileSync('diagnose_reqs.json', JSON.stringify(reqs, null, 2));
  
  // Find requests matching "Map Testing Final Edition" (which we saw in the screenshot)
  const mapTestingReqs = reqs.filter(r => r.propertyName === 'Map Testing Final Edition' || r.propertyTitle === 'Map Testing Final Edition');
  console.log(`Requests for "Map Testing Final Edition": ${mapTestingReqs.length}`);
  console.log(JSON.stringify(mapTestingReqs, null, 2));
}

diagnose().catch(console.error);
