const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from the standard Authorization header
  const authHeader = req.header('Authorization');

  // Check if token exists and is a Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token or malformed token, authorization denied' });
  }

  try {
    // Extract the token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to the request
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
