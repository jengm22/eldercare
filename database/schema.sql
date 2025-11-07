-- Create database (run this first in psql)
CREATE DATABASE eldercare_db;
\c eldercare_db;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    patient_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medications table
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    time VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication logs table
CREATE TABLE medication_logs (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id),
    taken_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    type VARCHAR(100) NOT NULL,
    doctor VARCHAR(200) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    location VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vitals table
CREATE TABLE vitals (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    type VARCHAR(100) NOT NULL,
    value VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts table
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check-ins table
CREATE TABLE checkins (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    type VARCHAR(50) NOT NULL,
    mood VARCHAR(50),
    notes TEXT,
    checkin_date DATE NOT NULL,
    checkin_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    name VARCHAR(300) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    name VARCHAR(200) NOT NULL,
    duration VARCHAR(50),
    activity_date DATE NOT NULL,
    activity_time TIME,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    title VARCHAR(300) NOT NULL,
    reminder_date DATE NOT NULL,
    reminder_time TIME NOT NULL,
    type VARCHAR(50),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample patient
INSERT INTO patients (first_name, last_name, phone, email) 
VALUES ('John', 'Doe', '555-0100', 'john@example.com');

-- Insert sample data
INSERT INTO medications (patient_id, name, dosage, frequency, time) VALUES
(1, 'Metformin', '500mg', 'Twice daily', '08:00, 20:00'),
(1, 'Lisinopril', '10mg', 'Once daily', '08:00');

INSERT INTO appointments (patient_id, type, doctor, appointment_date, appointment_time, location) VALUES
(1, 'Cardiology', 'Dr. Smith', CURRENT_DATE + 2, '10:00', 'Heart Center');

INSERT INTO vitals (patient_id, type, value, unit, recorded_at) VALUES
(1, 'blood_pressure', '120/80', 'mmHg', NOW()),
(1, 'glucose', '95', 'mg/dL', NOW());

INSERT INTO emergency_contacts (patient_id, name, phone, relationship, is_primary) VALUES
(1, 'Jane Doe', '555-0102', 'Daughter', true);

INSERT INTO activities (patient_id, name, duration, activity_date, completed) VALUES
(1, 'Morning Walk', '30 min', CURRENT_DATE, false);

INSERT INTO reminders (patient_id, title, reminder_date, reminder_time, type) VALUES
(1, 'Take medication', CURRENT_DATE, '20:00', 'health');

SELECT 'Database setup complete!' AS message;