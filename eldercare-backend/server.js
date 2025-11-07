// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = Number(process.env.PORT || 3001);

/* -------------------- Mongo setup -------------------- */
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'eldercare';
if (!MONGODB_URI) {
  // Fail fast in container if misconfigured
  console.error('MONGODB_URI is required');
  process.exit(1);
}

let client;
let db;
let ready = false;

async function connectMongo() {
  if (client) return client;
  client = new MongoClient(MONGODB_URI, {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL || '100', 10),
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    retryWrites: true,
  });
  await client.connect();
  db = client.db(MONGODB_DB);

  // Minimal indexes you likely need (safe to run repeatedly)
  await Promise.allSettled([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('appointments').createIndex({ patient_id: 1, appointment_date: 1 }),
    db.collection('medications').createIndex({ patient_id: 1, created_at: -1 }),
    db.collection('vitals').createIndex({ patient_id: 1, recorded_at: -1 }),
    db.collection('messages').createIndex({ patient_id: 1, created_at: -1 }),
    db.collection('activities').createIndex({ patient_id: 1, activity_date: -1 }),
    db.collection('reminders').createIndex({ patient_id: 1, reminder_date: 1 }),
    db.collection('invoices').createIndex({ patient_id: 1, created_at: -1 }),
    db.collection('medication_logs').createIndex({ medication_id: 1, taken_at: -1 }),
  ]);

  // ping to confirm connectivity
  await db.command({ ping: 1 });
  ready = true;
  console.log('✅ MongoDB connected');
}

function toObjectIdOrString(id) {
  // Accept both ObjectId and string ids seamlessly
  try {
    return new ObjectId(id);
  } catch {
    return id; // fall back to string
  }
}

/* -------------------- Middleware -------------------- */
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request/response timeouts (avoid stuck connections)
app.use((req, res, next) => {
  req.setTimeout(15000);
  res.setTimeout(15000);
  next();
});

/* -------------------- Health / readiness -------------------- */
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/readyz', (_req, res) => (ready ? res.send('ready') : res.status(503).send('not-ready')));

// keep your old path too (optional)
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

/* -------------------- Auth -------------------- */
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

/* -------------------- Routes -------------------- */

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = db.collection('users');
    const existing = await users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const userDoc = {
      email,
      password: hashedPassword,
      first_name: firstName || null,
      last_name: lastName || null,
      role: role || 'family',
      created_at: now,
      updated_at: now,
    };

    const result = await users.insertOne(userDoc);
    const userId = result.insertedId.toString();

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: userId,
        email,
        firstName: userDoc.first_name,
        lastName: userDoc.last_name,
        role: userDoc.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        patientId: user.patient_id ? String(user.patient_id) : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get medications
app.get('/api/patients/:patientId/medications', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const meds = await db
      .collection('medications')
      .find({ patient_id: pid })
      .sort({ created_at: -1 })
      .toArray();
    res.json(meds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments
app.get('/api/patients/:patientId/appointments', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const appts = await db
      .collection('appointments')
      .find({ patient_id: pid })
      .sort({ appointment_date: 1 })
      .toArray();
    res.json(appts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vitals
app.get('/api/patients/:patientId/vitals', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const vitals = await db
      .collection('vitals')
      .find({ patient_id: pid })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency contacts
app.get('/api/patients/:patientId/emergency-contacts', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const contacts = await db.collection('emergency_contacts').find({ patient_id: pid }).toArray();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get check-ins
app.get('/api/patients/:patientId/checkins', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const checkins = await db
      .collection('checkins')
      .find({ patient_id: pid })
      .sort({ checkin_date: -1 })
      .limit(30)
      .toArray();
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages (includes user name/role via lookup)
app.get('/api/patients/:patientId/messages', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const cursor = db.collection('messages').aggregate([
      { $match: { patient_id: pid } },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          patient_id: 1,
          user_id: 1,
          message: 1,
          created_at: 1,
          first_name: '$user.first_name',
          last_name: '$user.last_name',
          role: '$user.role',
        },
      },
    ]);
    const messages = await cursor.toArray();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents
app.get('/api/patients/:patientId/documents', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const docs = await db
      .collection('documents')
      .find({ patient_id: pid })
      .sort({ created_at: -1 })
      .toArray();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activities
app.get('/api/patients/:patientId/activities', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const activities = await db
      .collection('activities')
      .find({ patient_id: pid })
      .sort({ activity_date: -1 })
      .toArray();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update activity
app.put('/api/activities/:id', auth, async (req, res) => {
  try {
    const id = toObjectIdOrString(req.params.id);
    const { completed } = req.body;
    const result = await db
      .collection('activities')
      .findOneAndUpdate(
        { _id: id },
        { $set: { completed: !!completed, updated_at: new Date() } },
        { returnDocument: 'after' }
      );
    if (!result.value) return res.status(404).json({ error: 'Not found' });
    res.json(result.value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reminders
app.get('/api/patients/:patientId/reminders', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const reminders = await db
      .collection('reminders')
      .find({ patient_id: pid })
      .sort({ reminder_date: 1 })
      .toArray();
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
app.put('/api/reminders/:id', auth, async (req, res) => {
  try {
    const id = toObjectIdOrString(req.params.id);
    const { completed } = req.body;
    const result = await db
      .collection('reminders')
      .findOneAndUpdate(
        { _id: id },
        { $set: { completed: !!completed, updated_at: new Date() } },
        { returnDocument: 'after' }
      );
    if (!result.value) return res.status(404).json({ error: 'Not found' });
    res.json(result.value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices
app.get('/api/patients/:patientId/invoices', auth, async (req, res) => {
  try {
    const pid = toObjectIdOrString(req.params.patientId);
    const invoices = await db
      .collection('invoices')
      .find({ patient_id: pid })
      .sort({ created_at: -1 })
      .toArray();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log medication
app.post('/api/medications/:id/log', auth, async (req, res) => {
  try {
    const medicationId = toObjectIdOrString(req.params.id);
    const doc = {
      medication_id: medicationId,
      taken_at: req.body.takenAt ? new Date(req.body.takenAt) : new Date(),
      notes: req.body.notes || null,
      user_id: req.user?.id ? toObjectIdOrString(req.user.id) : null,
      created_at: new Date(),
    };
    const result = await db.collection('medication_logs').insertOne(doc);
    res.json({ _id: result.insertedId, ...doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- Boot & shutdown -------------------- */
let server;

async function start() {
  await connectMongo();
  server = http.createServer(app);
  // tighten timeouts for resilience
  server.requestTimeout = 15000;
  server.headersTimeout = 20000;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`❤️  Health:  /healthz  Ready: /readyz`);
  });
}

async function shutdown(signal) {
  try {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    await new Promise((resolve) => server.close(resolve));
    await client?.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((e) => {
  console.error('Fatal boot error', e);
  process.exit(1);
});
