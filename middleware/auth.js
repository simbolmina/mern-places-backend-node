const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    //req for options requested are not block. i used cors so it was not a problem to begin with tho
    return next();
  }
  try {
    //extract token from header
    const token = req.headers.authorization.split(' ')[1];
    //authorization: 'Bearer TOKEN'
    if (!token) {
      return next(new HttpError('Auth failed, login', 403));
    }

    //validate token
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    //add data (userId) to req.body extracted from token. token was created with userId and userEmail and secret code.
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    throw new Error('auth failed, login to continue');
  }
};
