import { v2 as cloudinary } from 'cloudinary';
import { withMiddleware } from './_lib/middleware.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default withMiddleware(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `users/${req.user.uid}`;
  const isKyc = req.body?.isKyc === true;

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[Cloudinary Sign] Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in environment.');
    return res.status(500).json({ error: 'Server configuration error: Cloudinary secrets missing.' });
  }
  
  // Base parameters
  const paramsToSign = { timestamp, folder };
  
  // If this is for KYC, force the type to private so it isn't publicly accessible
  if (isKyc) {
    paramsToSign.type = 'private';
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  const response = {
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
  
  if (isKyc) response.type = 'private';

  return res.status(200).json(response);
}, {
  methods: ['POST'],
  requireAuth: true,
  requireAdmin: false,
  bodyLimit: '2kb',
});
