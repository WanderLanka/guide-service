const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    const reason = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

module.exports = {
  verifyToken
};
