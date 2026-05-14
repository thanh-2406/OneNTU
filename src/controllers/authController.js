const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/jwt');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  // 1. Validate input
  if (!email || !password || !role) {
    return res.status(400).json({ status: 'error', message: 'Email, password, and role are required.' });
  }

  if (!['student', 'staff', 'admin'].includes(role)) {
    return res.status(400).json({ status: 'error', message: 'Invalid role specified.' });
  }

  try {
    // 2. Determine which table and ID column to use based on the role
    let tableName = '';
    let idColumn = '';

    if (role === 'student') {
      tableName = 'students';
      idColumn = 'student_id';
    } else if (role === 'staff') {
      tableName = 'staff';
      idColumn = 'staff_id';
    } else if (role === 'admin') {
      tableName = 'admins'; // Assuming your table is named 'admins'
      idColumn = 'admin_id';
    }

    // 3. Find the user in the database
    const userQuery = `SELECT * FROM ${tableName} WHERE email = $1 AND is_active = true`;
    const userResult = await db.query(userQuery, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials or inactive account.' });
    }

    const user = userResult.rows[0];

    // 4. Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    // 5. Generate Tokens (Format the user object slightly for the JWT utility)
    const tokenPayload = { id: user[idColumn] };
    const accessToken = generateAccessToken(tokenPayload, role);
    const refreshToken = generateRefreshToken(tokenPayload, role);

    // 6. Store the hashed refresh token in the sessions table
    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const sessionQuery = `
      INSERT INTO sessions (actor_type, actor_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.query(sessionQuery, [
      role, 
      user[idColumn], 
      hashedRefreshToken, 
      req.ip, 
      req.headers['user-agent'], 
      expiresAt
    ]);

    // 7. Send the response
    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user[idColumn],
          email: user.email,
          role: role,
          name: user.full_name // Adjust if admins table uses a different name column
        }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error during login.' });
  }
};

module.exports = { login };