import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

async function check() {
  const users = await db.collection('users').get();
  console.log(`Checked ${users.size} users`);
  users.forEach(doc => {
    const data = doc.data();
    if (data.referralCode) {
      console.log(`User: ${doc.id}, Email: ${data.email}, Code: ${data.referralCode}`);
    }
  });
}
check().catch(console.error);
