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

async function checkDetails() {
    try {
        console.log("Fetching detailed property list...");
        const propsSnap = await getDocs(collection(db, 'properties'));
        
        console.log(`Total properties in database: ${propsSnap.size}\n`);
        
        const stats = {
            approved: 0,
            unapproved: 0,
            statusCounts: {},
            byAvailability: {
                visible: 0,
                hidden: 0
            }
        };

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        propsSnap.forEach((doc, idx) => {
            const data = doc.data();
            const id = doc.id;
            const title = data.title || "Untitled";
            const isApproved = data.isApproved !== false;
            const status = data.status || "Available";
            
            // Check createdAt / updatedAt
            let dateVal = null;
            if (data.updatedAt) {
                dateVal = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            } else if (data.createdAt) {
                dateVal = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }
            
            let isRecent = true;
            if (dateVal) {
                isRecent = dateVal > ninetyDaysAgo;
            }

            const isVisible = isApproved && isRecent;

            if (isApproved) stats.approved++;
            else stats.unapproved++;

            stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
            
            if (isVisible) stats.byAvailability.visible++;
            else stats.byAvailability.hidden++;

            console.log(`${idx + 1}. [ID: ${id}]`);
            console.log(`   Title: ${title}`);
            console.log(`   Status: ${status} | Approved: ${isApproved} | Date: ${dateVal ? dateVal.toISOString().split('T')[0] : 'N/A'}`);
            console.log(`   Visible to Public: ${isVisible ? "YES" : "NO"}`);
            if (!isRecent && dateVal) {
                console.log(`   -> Hidden reason: Older than 90 days (Last updated: ${dateVal.toISOString().split('T')[0]})`);
            } else if (!isApproved) {
                console.log(`   -> Hidden reason: Not approved by Admin`);
            }
            console.log('--------------------------------------------');
        });

        console.log("\n--- OVERALL STATISTICS ---");
        console.log(`Total Listings: ${propsSnap.size}`);
        console.log(`Approved: ${stats.approved}`);
        console.log(`Unapproved (Pending): ${stats.unapproved}`);
        console.log(`Status Breakdown:`, JSON.stringify(stats.statusCounts, null, 2));
        console.log(`Availability to Public:`);
        console.log(`- Visible: ${stats.byAvailability.visible}`);
        console.log(`- Hidden: ${stats.byAvailability.hidden}`);

        process.exit(0);
    } catch (e) {
        console.error("Error fetching data:", e);
        process.exit(1);
    }
}

checkDetails();
