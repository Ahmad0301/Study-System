const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: 'd:/Study-System/Backend/.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const buffer = Buffer.from('hello world');

const uploadStream = cloudinary.uploader.upload_stream(
  {
    folder: 'test',
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
  },
  (error, result) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Result:', result);
    }
  }
);

const { Readable } = require('stream');
Readable.from(buffer).pipe(uploadStream);
