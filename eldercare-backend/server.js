require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Database
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected');
  }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, hashedPassword, firstName, lastName, role || 'family']
    );
    
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        role: result.rows[0].role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        patientId: user.patient_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get medications
app.get('/api/patients/:patientId/medications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medications WHERE patient_id = $1 ORDER BY created_at DESC',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments
app.get('/api/patients/:patientId/appointments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vitals
app.get('/api/patients/:patientId/vitals', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vitals WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 50',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency contacts
app.get('/api/patients/:patientId/emergency-contacts', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emergency_contacts WHERE patient_id = $1',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get check-ins
app.get('/api/patients/:patientId/checkins', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM checkins WHERE patient_id = $1 ORDER BY checkin_date DESC LIMIT 30',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages
app.get('/api/patients/:patientId/messages', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT m.*, u.first_name, u.last_name, u.role FROM messages m JOIN users u ON m.user_id = u.id WHERE m.patient_id = $1 ORDER BY m.created_at DESC',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents
app.get('/api/patients/:patientId/documents', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE patient_id = $1 ORDER BY created_at DESC',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activities
app.get('/api/patients/:patientId/activities', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE patient_id = $1 ORDER BY activity_date DESC',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update activity
app.put('/api/activities/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE activities SET completed = $1 WHERE id = $2 RETURNING *',
      [req.body.completed, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reminders
app.get('/api/patients/:patientId/reminders', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reminders WHERE patient_id = $1 ORDER BY reminder_date',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
app.put('/api/reminders/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE reminders SET completed = $1 WHERE id = $2 RETURNING *',
      [req.body.completed, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices
app.get('/api/patients/:patientId/invoices', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE patient_id = $1 ORDER BY created_at DESC',
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log medication
app.post('/api/medications/:id/log', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO medication_logs (medication_id, taken_at, notes) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.body.takenAt || new Date(), req.body.notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});