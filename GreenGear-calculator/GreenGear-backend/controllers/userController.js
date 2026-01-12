const pool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;


exports.userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Fetch user by username
    const result = await pool.query('SELECT * FROM "users_data" WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPassword = await bcrypt.compare(password, user.password_hash);
    if (!isPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    // const refreshToken = jwt.sign(
    //   { id: user.id, username: user.username },
    //   process.env.JWT_REFRESH_SECRET,
    //   { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    // );
    // refresh not working currently
    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   secure: false, // set to true for https (production)
    //   sameSite: 'Strict',
    //   maxAge: 30 * 24 * 60 * 60 * 1000
    // });

    res.json({ accessToken });
    console.log('User logged in: ', username);
  } catch (err) {
    console.error('Error during user login: ', err);
    res.status(500).json({ error: 'database error' });
  }
}

exports.changePassword = async (req, res) => {
  try {
    const id = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const result = await pool.query('SELECT * FROM "users_data" WHERE id = $1', [id]);
    const user = result.rows[0];

    const isPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE "users_data" SET password_hash = $1 WHERE id = $2', [newPasswordHash, id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error during password change: ', err);
    res.status(500).json({ error: 'database error' });
  }
}

exports.getRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies.refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }
    const refreshToken = cookies.refreshToken;
    jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET,
      (err, decoded) => {
        if (err) return res.status(403);
        const accessToken = jwt.sign(
          { "id": decoded.id, "username": decoded.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        )
        res.json({ accessToken }
        )

      }
    )
  } catch (err) {
    console.error('Error during token refresh: ', err);
    res.status(500).json({ error: 'database error' });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const { id, username } = req.user;

    res.json({
      id,
      username
    });
  } catch (err) {
    console.error('Error fetching user info: ', err);
    res.status(500).json({ error: 'database error' });
  }
}

// not needed without refresh tokens
exports.userLogout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) return res.sendStatus(204);
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    });
    res.json({ message: 'Logout successful' });
    console.log('User logged out');
  } catch (err) {
    console.error('Error during user logout: ', err);
    res.status(500).json({ error: 'database error' });
  }
}