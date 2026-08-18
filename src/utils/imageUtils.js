export function getOptimizedImageUrl(url, width = 800) {
    if (!url || typeof url !== 'string') return typeof url === 'string' ? url : '';
    
    // Pass through non-cloudinary URLs
    if (!url.includes('res.cloudinary.com')) return url;

    const uploadPath = '/image/upload/';
    if (!url.includes(uploadPath)) return url;

    const parts = url.split(uploadPath);
    if (parts.length !== 2) return url;
    
    const baseUrl = parts[0];
    const restUrl = parts[1];

    // Prevent double injection if transformations already exist
    if (restUrl.startsWith('w_') || restUrl.startsWith('q_') || restUrl.startsWith('f_') || restUrl.startsWith('c_')) {
        return url;
    }

    return `${baseUrl}${uploadPath}w_${width},q_auto,f_auto,c_fill/${restUrl}`;
}
