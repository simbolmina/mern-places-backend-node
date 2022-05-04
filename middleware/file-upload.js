const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/images');
    },
    filename: (req, file, cb) => {
      const fileExtention = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuidv4() + '.' + fileExtention);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    //convert null/undefined to false, convert any mimetype to true with !! operator
    let error = isValid ? null : new Error('Invalid file type!');
    cb(error, isValid);
  },
});

module.exports = fileUpload;
