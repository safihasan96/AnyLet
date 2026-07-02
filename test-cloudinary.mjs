import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
  cloud_name: 'test',
  api_key: 'test',
  api_secret: 'test',
});
const timestamp = Math.round(Date.now() / 1000);
const paramsToSign = { timestamp, folder: 'users/test' };
const signature = cloudinary.utils.api_sign_request(paramsToSign, 'test');
console.log(signature);
