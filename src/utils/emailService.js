import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// IMPORTANT: To make this work, replace these placeholders with real keys
// from your EmailJS dashboard (https://dashboard.emailjs.com/).
// Ensure your EmailJS template expects variables: {{to_name}}, {{to_email}}, {{property_title}}.
const EMAILJS_SERVICE_ID = 'service_xxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

/**
 * Sends a reminder email to a landlord asking them to confirm 
 * if a property is still available after 90 days of inactivity.
 * 
 * @param {string} email - The landlord's email address
 * @param {string} fullName - The landlord's name
 * @param {string} propertyTitle - The title of the listing
 */
export async function sendListingExpiryEmail(email, fullName, propertyTitle) {
  try {
    const templateParams = {
      to_email: email,
      to_name: fullName || 'Valued Landlord',
      property_title: propertyTitle,
      message: `Your property "${propertyTitle}" has not been updated in 90 days and is now hidden from public search. Please visit your dashboard to confirm if it is still available or to update its status.`
    };

    // Note: This will fail if the keys above are not configured or if the template doesn't match.
    // Since we don't want to crash the app if keys aren't set, we catch and log properly.
    if (EMAILJS_SERVICE_ID === 'service_xxxxxx') {
        console.warn('EmailJS keys are not configured. The expiry email would have been sent with these details:', templateParams);
        return { success: true, simulated: true };
    }

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('Expiry email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending listing expiry email:', error);
    // Don't throw the error, just return false so the UI doesn't crash, 
    // but the pseudo-cron might retry next time if we don't set the flag.
    return { success: false, error };
  }
}
