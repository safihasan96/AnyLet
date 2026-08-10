// Approximate coordinates for major Bangladeshi upazilas and districts
// Used as a geocoding fallback when properties don't have exact lat/lng stored.
// Coords sourced from well-known geographic centers.

export const divisionCoords = {
    "Dhaka":     { lat: 23.8103, lng: 90.4125 },
    "Chattogram":{ lat: 22.3569, lng: 91.7832 },
    "Khulna":    { lat: 22.8456, lng: 89.5403 },
    "Rajshahi":  { lat: 24.3745, lng: 88.6042 },
    "Barishal":  { lat: 22.7010, lng: 90.3535 },
    "Sylhet":    { lat: 24.8949, lng: 91.8687 },
    "Rangpur":   { lat: 25.7439, lng: 89.2752 },
    "Mymensingh":{ lat: 24.7471, lng: 90.4203 },
};

export const districtCoords = {
    "Dhaka":          { lat: 23.8103, lng: 90.4125 },
    "Gazipur":        { lat: 24.0022, lng: 90.4264 },
    "Narayanganj":    { lat: 23.6238, lng: 90.5000 },
    "Manikganj":      { lat: 23.8644, lng: 90.0047 },
    "Munshiganj":     { lat: 23.5422, lng: 90.5307 },
    "Narsingdi":      { lat: 23.9323, lng: 90.7152 },
    "Tangail":        { lat: 24.2513, lng: 89.9167 },
    "Kishoreganj":    { lat: 24.4445, lng: 90.7766 },
    "Netrokona":      { lat: 24.8698, lng: 90.7279 },
    "Faridpur":       { lat: 23.6072, lng: 89.8360 },
    "Gopalganj":      { lat: 23.0053, lng: 89.8270 },
    "Madaripur":      { lat: 23.1641, lng: 90.2016 },
    "Rajbari":        { lat: 23.7580, lng: 89.6443 },
    "Shariatpur":     { lat: 23.2423, lng: 90.4348 },
    "Chattogram":     { lat: 22.3569, lng: 91.7832 },
    "Cox's Bazar":    { lat: 21.4272, lng: 92.0058 },
    "Rangamati":      { lat: 22.6321, lng: 92.2035 },
    "Bandarban":      { lat: 22.1953, lng: 92.2184 },
    "Khagrachhari":   { lat: 23.1193, lng: 91.9847 },
    "Feni":           { lat: 23.0235, lng: 91.3979 },
    "Lakshmipur":     { lat: 22.9446, lng: 90.8282 },
    "Noakhali":       { lat: 22.8696, lng: 91.0994 },
    "Comilla":        { lat: 23.4607, lng: 91.1809 },
    "Chandpur":       { lat: 23.2279, lng: 90.6541 },
    "Brahmanbaria":   { lat: 23.9570, lng: 91.1116 },
    "Khulna":         { lat: 22.8456, lng: 89.5403 },
    "Bagerhat":       { lat: 22.6551, lng: 89.7860 },
    "Satkhira":       { lat: 22.7185, lng: 89.0705 },
    "Jessore":        { lat: 23.1664, lng: 89.2080 },
    "Narail":         { lat: 23.1726, lng: 89.5122 },
    "Magura":         { lat: 23.4878, lng: 89.4200 },
    "Jhenaidah":      { lat: 23.5448, lng: 89.1528 },
    "Kushtia":        { lat: 23.9013, lng: 89.1205 },
    "Meherpur":       { lat: 23.7621, lng: 88.6318 },
    "Chuadanga":      { lat: 23.6402, lng: 88.8415 },
    "Rajshahi":       { lat: 24.3745, lng: 88.6042 },
    "Chapainawabganj":{ lat: 24.5966, lng: 88.2785 },
    "Naogaon":        { lat: 24.7964, lng: 88.9488 },
    "Natore":         { lat: 24.4203, lng: 89.0005 },
    "Bogura":         { lat: 24.8465, lng: 89.3720 },
    "Joypurhat":      { lat: 25.1013, lng: 89.0227 },
    "Sirajganj":      { lat: 24.4534, lng: 89.7006 },
    "Pabna":          { lat: 24.0063, lng: 89.2372 },
    "Barishal":       { lat: 22.7010, lng: 90.3535 },
    "Bhola":          { lat: 22.1749, lng: 90.7154 },
    "Jhalokati":      { lat: 22.6450, lng: 90.1977 },
    "Patuakhali":     { lat: 22.3596, lng: 90.3290 },
    "Pirojpur":       { lat: 22.5809, lng: 89.9759 },
    "Barguna":        { lat: 22.1490, lng: 90.1123 },
    "Sylhet":         { lat: 24.8949, lng: 91.8687 },
    "Moulvibazar":    { lat: 24.4829, lng: 91.7774 },
    "Habiganj":       { lat: 24.3745, lng: 91.4152 },
    "Sunamganj":      { lat: 25.0659, lng: 91.3950 },
    "Rangpur":        { lat: 25.7439, lng: 89.2752 },
    "Dinajpur":       { lat: 25.6279, lng: 88.6336 },
    "Nilphamari":     { lat: 25.9317, lng: 88.8561 },
    "Gaibandha":      { lat: 25.3288, lng: 89.5286 },
    "Kurigram":       { lat: 25.8052, lng: 89.6363 },
    "Lalmonirhat":    { lat: 25.9923, lng: 89.2847 },
    "Panchagarh":     { lat: 26.3406, lng: 88.5531 },
    "Thakurgaon":     { lat: 26.0424, lng: 88.4604 },
    "Mymensingh":     { lat: 24.7471, lng: 90.4203 },
    "Jamalpur":       { lat: 24.9045, lng: 89.9375 },
    "Sherpur":        { lat: 25.0194, lng: 90.0152 },
};

export const upazilaCoords = {
    // Dhaka City Areas
    "Mirpur":         { lat: 23.8223, lng: 90.3654 },
    "Gulshan":        { lat: 23.7808, lng: 90.4158 },
    "Uttara":         { lat: 23.8759, lng: 90.3795 },
    "Dhanmondi":      { lat: 23.7461, lng: 90.3742 },
    "Motijheel":      { lat: 23.7338, lng: 90.4178 },
    "Rampura":        { lat: 23.7594, lng: 90.4255 },
    "Banani":         { lat: 23.7937, lng: 90.4066 },
    "Mohammadpur":    { lat: 23.7600, lng: 90.3560 },
    "Tejgaon":        { lat: 23.7696, lng: 90.3919 },
    "Badda":          { lat: 23.7808, lng: 90.4394 },
    "Demra":          { lat: 23.7121, lng: 90.4743 },
    "Paltan":         { lat: 23.7363, lng: 90.4150 },
    "Wari":           { lat: 23.7172, lng: 90.4097 },
    "Kotwali (Dhaka)": { lat: 23.7162, lng: 90.4040 },
    "Lalbagh":        { lat: 23.7200, lng: 90.3870 },
    "Hazaribagh":     { lat: 23.7250, lng: 90.3790 },
    "Kamrangirchar":  { lat: 23.7062, lng: 90.3728 },
    "Sutrapur":       { lat: 23.7105, lng: 90.4210 },
    "Shyampur":       { lat: 23.6955, lng: 90.4380 },
    "Jatrabari":      { lat: 23.7047, lng: 90.4477 },
    "Kadamtali":      { lat: 23.6960, lng: 90.4588 },
    "Khilgaon":       { lat: 23.7444, lng: 90.4366 },
    "Sabujbagh":      { lat: 23.7366, lng: 90.4430 },
    "Cantonment":     { lat: 23.8042, lng: 90.4040 },
    "Vatara":         { lat: 23.8185, lng: 90.4359 },
    "Dakshinkhan":    { lat: 23.8696, lng: 90.4280 },
    "Turag":          { lat: 23.8795, lng: 90.3540 },
    "Shah Ali":       { lat: 23.8406, lng: 90.3624 },
    // Gazipur
    "Gazipur Sadar":  { lat: 24.0022, lng: 90.4264 },
    "Tongi":          { lat: 23.9897, lng: 90.4021 },
    "Joydebpur":      { lat: 24.0022, lng: 90.4264 },
    "Sreepur":        { lat: 24.1958, lng: 90.4693 },
    "Kaliganj":       { lat: 23.9881, lng: 90.5047 },
    // Narayanganj
    "Narayanganj Sadar": { lat: 23.6238, lng: 90.5000 },
    "Rupganj":        { lat: 23.7558, lng: 90.5388 },
    "Araihazar":      { lat: 23.6866, lng: 90.6037 },
    "Bandar":         { lat: 23.6155, lng: 90.5180 },
    // Chattogram City Areas
    "Agrabad":        { lat: 22.3200, lng: 91.8000 },
    "Halishahar":     { lat: 22.3706, lng: 91.7756 },
    "Panchlaish":     { lat: 22.3620, lng: 91.8133 },
    "Kotwali (Chattogram)": { lat: 22.3360, lng: 91.8373 },
    "Bayazid":        { lat: 22.3921, lng: 91.8093 },
    "Khulshi":        { lat: 22.3742, lng: 91.8250 },
    "Double Mooring": { lat: 22.3420, lng: 91.8240 },
    "Pahartali":      { lat: 22.3890, lng: 91.7847 },
    "Sitakunda":      { lat: 22.6246, lng: 91.6610 },
    "Hathazari":      { lat: 22.5077, lng: 91.8103 },
    "Patiya":         { lat: 22.2970, lng: 91.9919 },
    "Cox's Bazar Sadar": { lat: 21.4272, lng: 92.0058 },
    "Teknaf":         { lat: 20.8618, lng: 92.3059 },
    "Ukhia":          { lat: 21.2070, lng: 92.1212 },
    // Sylhet areas
    "Sylhet Sadar":   { lat: 24.8949, lng: 91.8687 },
    "South Surma":    { lat: 24.8631, lng: 91.8416 },
    "Companiganj":    { lat: 25.2195, lng: 91.6261 },
    // Rajshahi areas
    "Rajshahi Sadar": { lat: 24.3745, lng: 88.6042 },
    "Boalia":         { lat: 24.3650, lng: 88.5990 },
    "Motihar":        { lat: 24.3845, lng: 88.5920 },
    "Shah Makhdum":   { lat: 24.3786, lng: 88.6220 },
    // Khulna areas
    "Khulna Sadar":   { lat: 22.8456, lng: 89.5403 },
    "Khalishpur":     { lat: 22.8340, lng: 89.5120 },
    "Daulatpur":      { lat: 22.8680, lng: 89.5530 },
    "Sonadanga":      { lat: 22.8540, lng: 89.5510 },
    // Rangpur
    "Rangpur Sadar":  { lat: 25.7439, lng: 89.2752 },
    "Badarganj":      { lat: 25.6773, lng: 89.0560 },
    // Mymensingh
    "Mymensingh Sadar": { lat: 24.7471, lng: 90.4203 },
    "Trishal":        { lat: 24.5945, lng: 90.3571 },
};

/**
 * Returns approximate {lat, lng} for a property based on upazila > district > division fallback.
 * Adds a small random jitter so multiple properties in same area don't stack on exactly one pixel.
 */
export function getPropertyCoords(property) {
    const jitter = () => (Math.random() - 0.5) * 0.008; // ~0.8km radius jitter

    const upazila = property.upazila?.trim();
    const district = property.district?.trim();
    const division = property.division?.trim();

    if (upazila && upazilaCoords[upazila]) {
        const c = upazilaCoords[upazila];
        return { lat: c.lat + jitter(), lng: c.lng + jitter() };
    }
    if (district && districtCoords[district]) {
        const c = districtCoords[district];
        return { lat: c.lat + jitter(), lng: c.lng + jitter() };
    }
    if (division && divisionCoords[division]) {
        const c = divisionCoords[division];
        return { lat: c.lat + jitter(), lng: c.lng + jitter() };
    }
    // Default to Dhaka centre
    return { lat: 23.8103 + jitter(), lng: 90.4125 + jitter() };
}
