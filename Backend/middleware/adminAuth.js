// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and is Basic
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="FSSAI Admin"');
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: No credentials provided' 
    });
  }

  try {
    // 2. Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.set('WWW-Authenticate', 'Basic realm="FSSAI Admin"');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Invalid credential format' 
      });
    }

    // 3. Get credentials from environment variables (Important)
    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPassword = process.env.ADMIN_PASSWORD;

    // Safety check: Agar env variables nahi hain to error do
    if (!correctUsername || !correctPassword) {
      console.error("❌ ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables!");
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error: Admin credentials not set' 
      });
    }

    // 4. Compare credentials
    if (username.trim() === correctUsername.trim() && 
        password === correctPassword) {
      return next();        // Authentication successful
    }

    // 5. Invalid credentials
    res.set('WWW-Authenticate', 'Basic realm="FSSAI Admin"');
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: Invalid username or password' 
    });

  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: Authentication failed' 
    });
  }
};

module.exports = adminAuth;