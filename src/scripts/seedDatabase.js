import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase.js";

const fakeListings = [
    {
        title: "Spacious Family Apartment with Balcony",
        rent: 45000,
        serviceCharge: 5000,
        area: "Mirpur",
        beds: 3,
        tenantType: "Family",
        baths: 3,
        sqft: 1800,
        type: "apartment",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        verified: true
    },
    {
        title: "Modern Bachelor Pad near Metro Station",
        rent: 20000,
        serviceCharge: 2000,
        area: "Uttara",
        beds: 1,
        tenantType: "Bachelor",
        baths: 1,
        sqft: 600,
        type: "apartment",
        image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        verified: false
    },
    {
        title: "Luxury Duplex with Lake View",
        rent: 95000,
        serviceCharge: 10000,
        area: "Gulshan",
        beds: 4,
        tenantType: "Family",
        baths: 4,
        sqft: 2500,
        type: "duplex",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        verified: true
    }
];

export async function seedDatabase() {
    try {
        console.log("Starting database seed...");
        const listingsRef = collection(db, "properties");

        for (const listing of fakeListings) {
            const docRef = await addDoc(listingsRef, listing);
            console.log(`Document written with ID: ${docRef.id} - ${listing.title}`);
        }

        console.log("Database seed completed successfully!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Execute the seed function
seedDatabase();
