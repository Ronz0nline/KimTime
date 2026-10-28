import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'kintime.db');
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to open SQLite database:', err.message);
  } else {
    console.log(`📦 SQLite database connected: ${DB_PATH}`);
  }
});

// Promisified DB helpers
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Initialize tables and seed initial data with authentic Indian credentials
export async function initDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  
  // Execute schema DDL statements
  await new Promise((resolve, reject) => {
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('Schema initialization error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // Ensure all detailed columns exist on users table
  try {
    const userColumns = await dbAll("PRAGMA table_info(users)");
    const colNames = userColumns.map(c => c.name);
    if (!colNames.includes('role_label')) await dbRun("ALTER TABLE users ADD COLUMN role_label TEXT");
    if (!colNames.includes('email')) await dbRun("ALTER TABLE users ADD COLUMN email TEXT");
    if (!colNames.includes('password_hash')) await dbRun("ALTER TABLE users ADD COLUMN password_hash TEXT");
    if (!colNames.includes('aadhaar_number')) await dbRun("ALTER TABLE users ADD COLUMN aadhaar_number TEXT");
    if (!colNames.includes('kyc_status')) await dbRun("ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'verified_aadhaar'");
    if (!colNames.includes('pledge_agreed')) await dbRun("ALTER TABLE users ADD COLUMN pledge_agreed INTEGER DEFAULT 1");
  } catch (err) {
    console.warn('User table migration note:', err.message);
  }

  // Populate missing details for existing seed accounts if needed
  try {
    await dbRun(`
      UPDATE users SET 
        role_label = COALESCE(role_label, 'Primary Family Caregiver'),
        email = COALESCE(email, 'ananya.deshmukh@kintime.in'),
        aadhaar_number = COALESCE(aadhaar_number, '5482-1928-3491'),
        kyc_status = COALESCE(kyc_status, 'verified_aadhaar'),
        pledge_agreed = COALESCE(pledge_agreed, 1)
      WHERE id = 'usr-ananya';
    `);
    await dbRun(`
      UPDATE users SET 
        role_label = COALESCE(role_label, 'Volunteer Companion / Neighbor'),
        email = COALESCE(email, 'priya.sundaram@kintime.in'),
        aadhaar_number = COALESCE(aadhaar_number, '8841-3920-5512'),
        kyc_status = COALESCE(kyc_status, 'verified_aadhaar'),
        pledge_agreed = COALESCE(pledge_agreed, 1)
      WHERE id = 'usr-priya';
    `);
  } catch (e) {}

  // Re-seed if old or empty
  const existingUser = await dbGet('SELECT id FROM users WHERE id = "usr-ananya"');
  if (!existingUser) {
    console.log('🌱 Seeding KinTime database with authentic Indian Caregiver credentials...');

    // Clear previous seed if any
    await dbRun('DELETE FROM waivers');
    await dbRun('DELETE FROM sos_dispatches');
    await dbRun('DELETE FROM ledger_entries');
    await dbRun('DELETE FROM tasks');
    await dbRun('DELETE FROM users');

    // Seed Indian Users & Personas with comprehensive profile details
    await dbRun(`
      INSERT INTO users (id, name, role, role_label, cluster, phone, email, password_hash, aadhaar_number, kyc_status, pledge_agreed) VALUES 
      ('usr-ananya', 'Ananya Deshmukh', 'caregiver', 'Primary Family Caregiver', 'Indiranagar Care Circle, Bengaluru, KA', '+91 98450 21982', 'ananya.deshmukh@kintime.in', 'kintime2026', '5482-1928-3491', 'verified_aadhaar', 1),
      ('usr-priya', 'Priya Sundaram', 'volunteer', 'Volunteer Companion / Neighbor', 'Malleshwaram Elder Support Net, Bengaluru, KA', '+91 98860 31245', 'priya.sundaram@kintime.in', 'kintime2026', '8841-3920-5512', 'verified_aadhaar', 1),
      ('usr-harish', 'Prof. Harish Kulkarni', 'volunteer', 'Retired Professor • Community Angel', 'Jayanagar 4th Block Circle, Bengaluru, KA', '+91 98450 44210', 'harish.kulkarni@kintime.in', 'kintime2026', '7732-4419-8802', 'verified_aadhaar', 1),
      ('usr-shanti', 'Shanti Sharma (79)', 'recipient', 'Senior Recipient / Elder', 'Indiranagar Care Circle, Bengaluru, KA', '+91 98451 90812', 'shanti.sharma@kintime.in', 'kintime2026', '9912-3841-7723', 'verified_aadhaar', 1),
      ('usr-rajesh', 'Rajesh K. Verma', 'caregiver', 'Primary Family Caregiver', 'Vasant Kunj Sector C, New Delhi, DL', '+91 98110 56238', 'rajesh.verma@kintime.in', 'kintime2026', '6621-8840-2219', 'verified_aadhaar', 1),
      ('usr-nair', 'Col. R.K. Nair (Retd.)', 'recipient', 'Senior Recipient / Elder', 'Koregaon Park Elder Net, Pune, MH', '+91 94220 88194', 'rk.nair@kintime.in', 'kintime2026', '3391-7720-4418', 'verified_aadhaar', 1),
      ('usr-arjun', 'Arjun Reddy', 'volunteer', 'Volunteer Companion / Neighbor', 'Jubilee Hills Care Hub, Hyderabad, TG', '+91 99890 41230', 'arjun.reddy@kintime.in', 'kintime2026', '4410-6629-3381', 'verified_aadhaar', 1);
    `);

    // Seed Indian Care Exchange Tasks
    const initialTasks = [
      {
        id: 'task-101',
        title: 'Evening Courtyard Tulsi Respite & Premchand Story Reading for Dadi',
        tier: 'tier-2',
        tierLabel: 'Tier 2: Respite',
        hours: 2.50,
        requesterId: 'usr-shanti',
        requesterName: 'Mrs. Shanti Sharma (79) • Daughter-in-Law Ananya',
        cluster: 'Indiranagar Care Circle, Bengaluru',
        desc: 'Spend a soothing evening on the courtyard verandah. Read classic Munshi Premchand short stories, water the potted Tulsi, share warm ginger tea. Zero clinical tasks.',
        details: JSON.stringify(['Verandah seating with wheelchair ramp', 'Ginger-tulsi chai and biscuits provided', 'Peaceful evening atmosphere']),
        status: 'open'
      },
      {
        id: 'task-102',
        title: 'Jan Aushadhi Kendra Blood Pressure Medicine & Test Strips Pickup',
        tier: 'tier-1',
        tierLabel: 'Tier 1: Errands',
        hours: 1.00,
        requesterId: 'usr-rajesh',
        requesterName: 'Rajesh K. Verma • Son & Primary Caregiver',
        cluster: 'Vasant Kunj Sector C, New Delhi',
        desc: 'Collect subsidized monthly prescription pack from Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Kendra on Aruna Asaf Ali Marg and hand over at doorway.',
        details: JSON.stringify(['Pre-paid order #PMBJP-9482', '5-minute contactless delivery', 'Aadhaar / OTP verified handoff']),
        status: 'open'
      },
      {
        id: 'task-103',
        title: 'Morning Cubbon Park Stroll & Carnatic Music Companion for Col. Nair',
        tier: 'tier-2',
        tierLabel: 'Tier 2: Respite',
        hours: 2.00,
        requesterId: 'usr-nair',
        requesterName: 'Meera Nair • Daughter & Caregiver',
        cluster: 'Lavelle Road & Richmond Town, Bengaluru',
        desc: 'Accompany 81-year-old retired army officer on paved flat walkways in Cubbon Park or sit enjoying classical Carnatic ragas while caregiver attends doctor appointment.',
        details: JSON.stringify(['Paved walking trail with park benches', 'Caregiver reachable on phone', 'Senior citizen ID verified']),
        status: 'open'
      },
      {
        id: 'task-104',
        title: 'Auto/Cab Escort for Dialysis Session at Manipal Hospital',
        tier: 'tier-1',
        tierLabel: 'Tier 1: Errands',
        hours: 3.00,
        requesterId: 'usr-ananya',
        requesterName: 'Vikram Malhotra • Son & Caregiver',
        cluster: 'Old Airport Road Net, Bengaluru',
        desc: 'Accompany senior patient in pre-booked wheelchair auto/cab to Manipal Hospital dialysis wing, assist through OPD desk, and accompany back home.',
        details: JSON.stringify(['Cab fare and hospital pass pre-arranged', 'Wheelchair elevator assistance', 'Strict non-medical accompaniment']),
        status: 'open'
      },
      {
        id: 'task-105',
        title: 'Afternoon Reminiscence & Traditional Filter Coffee Companionship',
        tier: 'tier-2',
        tierLabel: 'Tier 2: Respite',
        hours: 1.50,
        requesterId: 'usr-ananya',
        requesterName: 'Dr. Kavita Iyer • Family Caregiver',
        cluster: 'Adyar & Besant Nagar Net, Chennai',
        desc: 'Spend 90 minutes looking through old photo albums from Madurai and having South Indian filter kaapi. Primary caregiver needs quiet time for telehealth consultation.',
        details: JSON.stringify(['Air-conditioned living room', 'Traditional brass filter kaapi provided', 'Escrow pre-funded in ledger']),
        status: 'open'
      },
      {
        id: 'task-106',
        title: 'Rythu Bazar / Organic Millets & Fresh Sabzi Mandi Delivery',
        tier: 'tier-1',
        tierLabel: 'Tier 1: Errands',
        hours: 1.50,
        requesterId: 'usr-arjun',
        requesterName: 'Hyderabad Senior Care Collective',
        cluster: 'Jubilee Hills & Banjara Hills, Hyderabad',
        desc: 'Pick up pre-packed organic ragi/millets and fresh sabzi box from local farmers market and deliver to two homebound elderly couples.',
        details: JSON.stringify(['Box weight under 7 kg', 'Apartment security gate pass ready', 'Verified neighbor route']),
        status: 'open'
      }
    ];

    for (const t of initialTasks) {
      await dbRun(`
        INSERT INTO tasks (id, title, tier, tier_label, hours, requester_id, requester_name, cluster, description, details_json, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [t.id, t.title, t.tier, t.tierLabel, t.hours, t.requesterId, t.requesterName, t.cluster, t.desc, t.details, t.status]);
    }

    // Seed Initial Append-Only Double-Entry Ledger Transactions with Indian context
    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash, created_at)
      VALUES 
      ('tx-1001', 'usr-ananya', 'CREDIT', 4.00, NULL, 'System Grant', 'Initial Caregiver Onboarding Stake (Bengaluru Mutual Care Net)', 'Karnataka Care Trust Escrow', 'settled', 'sha256:9c44e0192a88...a117', datetime('now', '-7 days')),
      ('tx-1002', 'usr-ananya', 'DEBIT', 1.50, 'task-104', 'Tier 1 Errand', 'Dialysis Auto Escrow Release at Manipal Hospital', 'Helper Rohan Gupta', 'settled', 'sha256:3a18f8841b99...d902', datetime('now', '-3 days')),
      ('tx-1003', 'usr-ananya', 'CREDIT', 2.00, 'task-101', 'Tier 2 Respite', 'Evening Verandah Respite for Dadi (Mrs. Shanti Sharma)', 'Volunteer Priya Sundaram', 'settled', 'sha256:7b91e6629c11...c421', datetime('now', '-1 day'));
    `);

    console.log('✅ SQLite database successfully seeded with authentic Indian Caregiver credentials!');
  }
}
