const { memoryStorage } = require('multer');
console.log('memoryStorage from require:', typeof memoryStorage);

import * as multer from 'multer';
console.log('multer.memoryStorage from import * as:', typeof multer.memoryStorage);
