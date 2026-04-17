const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/userModel');

// ─────────────────────────────────────────
// POST /auth/register
// Body: { name, email, password, role }
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check all fields exist
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'All fields are required: name, email, password, role'
      });
    }

    // 2. Validate role value
    const allowedRoles = ['patient', 'doctor', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Role must be patient, doctor, or admin'
      });
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'This email is already registered'
      });
    }

    // 4. Hash the password (never save plain text)
    const hashedPassword = await bcrypt.hash(password, 10);
    // 10 = salt rounds (how strong the hashing is)

    // 5. Save user to MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // 6. Create JWT token
    const token = jwt.sign(
      {
        id:    newUser._id,
        email: newUser.email,
        role:  newUser.role,
        name:  newUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // token valid for 7 days
    );

    // 7. Send response (never send password back)
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id:   newUser._id,
        name: newUser.name,
        email: newUser.email,
        role:  newUser.role,
        isVerified: newUser.isVerified
      }
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// ─────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields exist
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: 'No account found with this email'
      });
    }

    // 3. Compare password with hashed version in DB
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: 'Incorrect password'
      });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      {
        id:    user._id,
        email: user.email,
        role:  user.role,
        name:  user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Send response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// ─────────────────────────────────────────
// GET /auth/me
// Verify token is still valid
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Source of truth is DB (admin may verify after token was issued)
    // Keep this endpoint safe: it only returns fields for the current user.
    // Note: decoded.id is set at token creation time.
    //
    // (If DB lookup fails, default to false.)
    // eslint-disable-next-line no-unused-vars
    const _id = String(decoded.id);
    // Since this route is sync-ish today, use a small async wrapper.
    // (Keeping minimal changes to existing structure.)
    // We cannot mark this handler async without changing the signature; instead,
    // we do a blocking-style promise chain and return inside.
    return User.findById(_id).select('isVerified').then((dbUser) => {
      res.json({
        user: {
          id:    decoded.id,
          name:  decoded.name,
          email: decoded.email,
          role:  decoded.role,
          isVerified: dbUser && dbUser.isVerified ? true : false
        }
      });
    }).catch(() => {
      res.json({
        user: {
          id:    decoded.id,
          name:  decoded.name,
          email: decoded.email,
          role:  decoded.role,
          isVerified: false
        }
      });
    });

  } catch (err) {
    res.status(403).json({ error: 'Token is invalid or expired' });
  }
});


module.exports = router;