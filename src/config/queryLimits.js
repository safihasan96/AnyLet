/**
 * QUERY_LIMITS — Firestore Query Bounds Configuration (F-08)
 *
 * Centralises all Firestore query limit constants so they are easy to tune
 * without touching individual page/component files.
 */

const QUERY_LIMITS = {
  // --- Search & Browse ---
  SEARCH_RESULTS: 20,          // Max properties returned per search query
  FEATURED_LISTINGS: 8,        // Homepage featured properties
  SIMILAR_PROPERTIES: 6,       // "Similar listings" carousel on PropertyDetails

  // --- Admin ---
  ADMIN_PROPERTIES: 50,        // Properties table in AdminPanel
  ADMIN_USERS: 50,             // Users table in AdminPanel / AdminUsers
  ADMIN_REPORTS: 50,           // Flagged reports list
  ADMIN_PAYMENTS: 50,          // Payment records

  // --- Map ---
  MAP_PROPERTIES: 100,         // Max pins rendered on the map view

  // --- User dashboards ---
  MY_LISTINGS: 20,             // Landlord's own listings
  MY_BOOKINGS: 20,             // Tenant's booking history
  MY_MOVE_INS: 20,             // Tenant's move-in records
  NOTIFICATIONS: 30,           // Notification feed
  FAVORITES: 20,               // Saved properties

  // --- Property detail ---
  REVIEWS_PER_PROPERTY: 10,    // Reviews shown on PropertyDetails
  ENQUIRIES_PER_PROPERTY: 20,  // Enquiry list on Enquiry page

  // --- Referrals / Leaderboard ---
  REFERRAL_LEADERBOARD: 20,    // Agents / referral leaderboard
};

export default QUERY_LIMITS;
