# Media Pipeline Integration (Cloudinary Deep Dive)

## Architecture Overview
AnyLet handles heavy media files (Property Images, Avatars, KYC Documents) by utilizing a **Secure Client-Direct Upload Pipeline** to Cloudinary. This bypasses the Vercel serverless backend entirely, avoiding 4.5MB payload limits, base64 encoding bloat, and costly execution timeouts.

## The Upload Flow (End-to-End)

### 1. Frontend Selection & Pre-processing
When a user uploads an avatar via `<input type="file">`, the browser intercepts the file blob. For specific use cases (like avatars), a library like `react-easy-crop` mounts, allowing the user to zoom and crop the image within an HTML5 Canvas. The canvas exports a compressed `.jpeg` blob.

### 2. The Signature Request (API Contract)
Because we do not expose the Cloudinary Secret on the frontend, the client must ask the server for a cryptographically signed permission slip to upload.

- **Endpoint**: `POST /api/cloudinary-sign`
- **Request Body**:
  ```json
  { "folder": "anylet_avatars" }
  ```
- **Backend Logic (`[[api/cloudinary-sign.js]]`)**:
  Reads `CLOUDINARY_API_SECRET`. Generates a Unix timestamp. Computes a SHA-1 hash of `folder=anylet_avatars&timestamp=1700000000` combined with the secret.
- **Response**:
  ```json
  {
    "signature": "a1b2c3d4e5f6...",
    "timestamp": 1700000000,
    "cloudName": "anylet-media",
    "apiKey": "123456789"
  }
  ```

### 3. Direct Client Upload
The React component extracts the JSON response and constructs a direct `FormData` POST request to Cloudinary's unauthenticated upload API:
`https://api.cloudinary.com/v1_1/<cloudName>/image/upload`

Payload includes:
- `file`: (The actual image blob)
- `api_key`: (From response)
- `timestamp`: (From response)
- `signature`: (From response)
- `folder`: (Must exactly match what was signed)

### 4. Database Reconciliation
Cloudinary validates the SHA-1 signature. If valid, it processes the image and returns a response containing the permanent `secure_url`. The React client then executes a Firebase `updateDoc()` on the `users` or `properties` collection, persisting that URL.

## Image Optimization Parameters
Cloudinary URLs are heavily optimized on the frontend prior to rendering.

Given a raw URL:
`https://res.cloudinary.com/anylet-media/image/upload/v1/anylet_avatars/user123.jpg`

The utility function `[[src/utils/imageUtils.js]]` injects delivery parameters between the `upload/` path segment and the version ID.

**Transformations Applied:**
- `f_auto`: Automatically converts the image to WebP or AVIF based on the requesting browser's capabilities.
- `q_auto`: Employs AI to aggressively compress the image (often 60-80% smaller) without perceptible visual degradation.
- `c_fill,w_800,h_600`: Resizes property images to a standard aspect ratio to prevent Cumulative Layout Shift (CLS) in `[[src/components/PropertyCard.jsx]]`.
