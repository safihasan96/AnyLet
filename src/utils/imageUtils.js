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

/**
 * compressImage — shrinks an image file using the Canvas API before upload.
 * Zero dependencies. Targets ≤1280px max dimension and ~82% JPEG quality.
 *
 * @param {File} file - The original image File object
 * @param {object} [opts]
 * @param {number} [opts.maxWidth=1280]  - Max width/height in px
 * @param {number} [opts.quality=0.82]   - JPEG quality 0–1
 * @param {number} [opts.maxSizeKB=800]  - Skip compression if already below this
 * @returns {Promise<File>} - A compressed File (same name, image/jpeg type)
 */
export async function compressImage(file, { maxWidth = 1280, quality = 0.82, maxSizeKB = 800 } = {}) {
    // Already small enough — skip the canvas round-trip
    if (file.size / 1024 < maxSizeKB) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down while preserving aspect ratio
                if (width > maxWidth || height > maxWidth) {
                    if (width >= height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error('Canvas toBlob failed'));
                        // Preserve filename but force .jpg extension
                        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                        resolve(new File([blob], name, { type: 'image/jpeg' }));
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = ev.target.result;
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(file);
    });
}
