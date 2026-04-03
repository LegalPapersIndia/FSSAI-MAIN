// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Unauthorized: No credentials provided' });
  }

  // Decode Basic Auth
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const correctUsername = process.env.ADMIN_USERNAME || 'legalpapersindia@gmail.com';
  const correctPassword = process.env.ADMIN_PASSWORD || 'Admin@#7890';

  if (username === correctUsername && password === correctPassword) {
    return next(); // Auth successful
  }

  res.set('WWW-Authenticate', 'Basic realm="FSSAI Admin"');
  return res.status(401).json({ message: 'Unauthorized: Invalid credentials' });
};

module.exports = adminAuth;