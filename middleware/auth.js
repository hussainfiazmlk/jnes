const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');

const authenticate_token = (req, res, next) => {
  try {
    const modelPath = process.cwd() + /models/;
    const table = req.params.table;
    const modelJson = require(modelPath + table);

    // public access
    if (req.method === 'GET' && modelJson.isPublic) {
      next();
    } else {
      // 1) Getting token and check it's there
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ success: false, error: 'unauthorized' });
      }

      // 2) Verification token
      const cryptr = new Cryptr(process.env.TOKEN_SECRET);
      const decoded = jwt.verify(cryptr.decrypt(token), process.env.TOKEN_SECRET);

      req.user = decoded.user;
      next();
    }
  } catch (error) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
};

module.exports = { authenticate_token };