import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, dbAll, dbGet, dbRun } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'database', 'kintime.db');

const app = express();
const PORT = process.env.PORT || 3001;
const defaultUserId = 'usr-ananya';
const defaultUserName = 'Ananya Deshmukh';

app.use(cors());
app.use(express.json());

// Initialize Database on launch
await initDatabase();

// 1. Status & Health Check
app.get('/api/status', async (req, res) => {
  try {
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    const taskCount = await dbGet('SELECT COUNT(*) as count FROM tasks');
    const ledgerCount = await dbGet('SELECT COUNT(*) as count FROM ledger_entries');
    const balanceInfo = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [defaultUserId]);

    res.json({
      status: 'online',
      database: 'SQLite 3.x',
      dbPath: DB_PATH,
      counts: {
        users: userCount.count,
        tasks: taskCount.count,
        ledgerEntries: ledgerCount.count
      },
      activeUserBalance: balanceInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fetch Tasks (Care Board)
app.get('/api/tasks', async (req, res) => {
  try {
    const tier = req.query.tier;
    let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
    let params = [];

    if (tier && tier !== 'all') {
      query = 'SELECT * FROM tasks WHERE tier = ? ORDER BY created_at DESC';
      params = [tier];
    }

    const rows = await dbAll(query, params);
    const formatted = rows.map(r => ({
      ...r,
      details: r.details_json ? JSON.parse(r.details_json) : []
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Post a Neighborly Care Request (Double-Entry Escrow Lock)
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, tier, hours, cluster, description, requesterId: reqRequesterId, requesterName: reqRequesterName } = req.body;
    const taskId = `task-${Date.now()}`;
    const tierLabel = tier === 'tier-1' ? 'Tier 1: Errands' : 'Tier 2: Respite';
    const requesterId = reqRequesterId || defaultUserId;
    const requesterName = reqRequesterName || defaultUserName;

    // Insert task
    await dbRun(`
      INSERT INTO tasks (id, title, tier, tier_label, hours, requester_id, requester_name, cluster, description, details_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `, [taskId, title, tier, tierLabel, parseFloat(hours), requesterId, requesterName, cluster, description, JSON.stringify(['Escrow lock active', 'Non-clinical terms certified', 'Good Samaritan eligible'])]);

    // Insert double-entry escrow lock in ledger
    const txId = `tx-escrow-${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(`${txId}-${taskId}-${Date.now()}`).digest('hex').substring(0, 16)}`;

    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash)
      VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, 'Community Escrow Custody', 'escrow', ?)
    `, [txId, requesterId, parseFloat(hours), taskId, tierLabel, `Escrow Lock: ${title}`, hash]);

    const balance = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [requesterId]);
    res.json({ success: true, taskId, balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Claim Task with Good Samaritan Waiver
app.post('/api/tasks/:id/claim', async (req, res) => {
  try {
    const taskId = req.params.id;
    const signerId = defaultUserId;
    const signerName = defaultUserName;

    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Record signed waiver
    await dbRun(`
      INSERT INTO waivers (task_id, signer_id, signer_name, terms_version, scope_acknowledged)
      VALUES (?, ?, ?, 'V2.4', 1)
    `, [taskId, signerId, signerName]);

    // Update task
    await dbRun(`
      UPDATE tasks SET status = 'claimed', claimed_by_id = ?, claimed_by_name = ? WHERE id = ?
    `, [signerId, signerName, taskId]);

    // Insert ledger escrow lock
    const txId = `tx-claim-${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(`${txId}-${taskId}`).digest('hex').substring(0, 16)}`;

    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash)
      VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, ?, 'escrow', ?)
    `, [txId, signerId, task.hours, taskId, task.tier_label, `Good Samaritan Claim: ${task.title}`, task.requester_name, hash]);

    res.json({ success: true, taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4b. Delete My Care Request (Returns Escrow Hours to Balance)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Release escrow if task was open
    if (task.status === 'open' && task.hours > 0) {
      const refundTxId = `tx-refund-${Date.now()}`;
      const hash = `sha256:${crypto.createHash('sha256').update(`${refundTxId}-${taskId}`).digest('hex').substring(0, 16)}`;
      await dbRun(`
        INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash)
        VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, 'Community Escrow Return', 'settled', ?)
      `, [refundTxId, task.requester_id || defaultUserId, task.hours, taskId, task.tier_label || 'Tier 1: Errands', `Escrow Refund / Post Deleted: ${task.title}`, hash]);
    }

    // Delete task from database
    await dbRun('DELETE FROM tasks WHERE id = ?', [taskId]);

    const balanceInfo = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [task.requester_id || defaultUserId]);
    res.json({
      success: true,
      message: 'Post deleted successfully and escrow returned',
      taskId,
      balance: balanceInfo ? balanceInfo.settled_balance : 4.50
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4c. Account Creation Workflow (All User Details Stored in SQLite & 5.0h Starter Care Grant)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, role, roleLabel, cluster, phone, email, password, aadhaarNumber, pledgeAgreed } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const userId = `usr-${Date.now().toString(36)}`;
    const userRole = role || 'caregiver';
    const roleLabelsMap = {
      caregiver: 'Primary Family Caregiver',
      volunteer: 'Volunteer Companion / Neighbor',
      recipient: 'Senior Recipient / Elder'
    };
    const userRoleLabel = roleLabel || roleLabelsMap[userRole] || 'Primary Family Caregiver';
    const userCluster = cluster || 'Indiranagar Care Circle, Bengaluru';
    const userPhone = phone || '+91 98450 00000';
    const userEmail = email || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@kintime.in`;
    const passwordHash = password || 'kintime2026';
    const userAadhaar = aadhaarNumber || '5482-1928-3491';
    const isPledgeAgreed = pledgeAgreed !== undefined ? (pledgeAgreed ? 1 : 0) : 1;

    // Insert ALL user details into SQLite database
    await dbRun(`
      INSERT INTO users (id, name, role, role_label, cluster, phone, email, password_hash, aadhaar_number, kyc_status, pledge_agreed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified_aadhaar', ?)
    `, [userId, name.trim(), userRole, userRoleLabel, userCluster, userPhone, userEmail, passwordHash, userAadhaar, isPledgeAgreed]);

    // Issue 5.0h Starter Care Grant (Double-Entry Ledger Credit)
    const txId = `tx-grant-${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(`${txId}-${userId}`).digest('hex').substring(0, 16)}`;
    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, tier, description, counterparty, status, cryptographic_hash)
      VALUES (?, ?, 'CREDIT', 5.00, 'Care Grant', 'Starter Care Grant (Aadhaar Verified Welcome)', 'KinTime Mutual Aid Protocol', 'settled', ?)
    `, [txId, userId, hash]);

    const balanceInfo = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        role: userRole,
        roleLabel: userRoleLabel,
        cluster: userCluster,
        phone: userPhone,
        email: userEmail,
        aadhaarNumber: userAadhaar,
        kycStatus: 'verified_aadhaar',
        pledgeAgreed: isPledgeAgreed,
        balance: balanceInfo ? balanceInfo.settled_balance : 5.00
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4d. Account Login Workflow (Retrieves All Stored Details from SQLite)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phoneOrEmail, name } = req.body;
    let user = null;

    if (phoneOrEmail) {
      user = await dbGet(`
        SELECT id, name, role, role_label, cluster, phone, email, aadhaar_number, kyc_status, pledge_agreed, created_at
        FROM users
        WHERE phone = ? OR phone LIKE ? OR email = ? OR email LIKE ?
        LIMIT 1
      `, [phoneOrEmail, `%${phoneOrEmail}%`, phoneOrEmail, `%${phoneOrEmail}%`]);
    }

    if (!user && name) {
      user = await dbGet(`
        SELECT id, name, role, role_label, cluster, phone, email, aadhaar_number, kyc_status, pledge_agreed, created_at
        FROM users
        WHERE name LIKE ?
        LIMIT 1
      `, [`%${name}%`]);
    }

    // Default to Ananya Deshmukh if not found or demo login
    if (!user) {
      user = await dbGet(`
        SELECT id, name, role, role_label, cluster, phone, email, aadhaar_number, kyc_status, pledge_agreed, created_at
        FROM users
        WHERE id = ?
      `, [defaultUserId]);
    }

    const balanceInfo = user ? await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [user.id]) : null;

    res.json({
      success: true,
      user: {
        id: user ? user.id : defaultUserId,
        name: user ? user.name : defaultUserName,
        role: user ? user.role : 'caregiver',
        roleLabel: user && user.role_label ? user.role_label : 'Primary Family Caregiver',
        cluster: user ? user.cluster : 'Indiranagar Care Circle, Bengaluru',
        phone: user ? user.phone : '+91 98450 21982',
        email: user && user.email ? user.email : 'ananya.deshmukh@kintime.in',
        aadhaarNumber: user && user.aadhaar_number ? user.aadhaar_number : '5482-1928-3491',
        kycStatus: user && user.kyc_status ? user.kyc_status : 'verified_aadhaar',
        pledgeAgreed: user && user.pledge_agreed !== undefined ? user.pledge_agreed : 1,
        createdAt: user ? user.created_at : null,
        balance: balanceInfo ? balanceInfo.settled_balance : 4.50
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4e. List All Registered Users (All Details from SQLite)
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT 
        u.id, u.name, u.role, u.role_label, u.cluster, u.phone, u.email, u.aadhaar_number, u.kyc_status, u.pledge_agreed, u.created_at,
        COALESCE(b.settled_balance, 0.0) AS settled_balance
      FROM users u
      LEFT JOIN vw_user_balances b ON u.id = b.user_id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Fetch Ledger & User Balances
app.get('/api/ledger', async (req, res) => {
  try {
    const entries = await dbAll('SELECT * FROM ledger_entries ORDER BY created_at DESC');
    const balanceInfo = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [defaultUserId]);

    res.json({
      balance: balanceInfo ? balanceInfo.settled_balance : 4.50,
      escrowLocked: balanceInfo ? balanceInfo.escrow_locked_balance : 0.00,
      overdraftGrace: balanceInfo ? balanceInfo.overdraft_grace_buffer : 3.00,
      effectiveAvailable: balanceInfo ? balanceInfo.effective_available_hours : 7.50,
      transactions: entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Settle Respite (+2.00 hrs Settlement Simulation)
app.post('/api/ledger/settle', async (req, res) => {
  try {
    const depositHours = 2.00;
    const userId = defaultUserId;
    const txId = `tx-settle-${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(`${txId}-${Date.now()}`).digest('hex').substring(0, 16)}`;

    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash)
      VALUES (?, ?, 'CREDIT', ?, NULL, 'Tier 2 Respite', 'Simulated Respite Execution Settlement', 'Neighbor Peer Dual-Check', 'settled', ?)
    `, [txId, userId, depositHours, hash]);

    const balanceInfo = await dbGet('SELECT * FROM vw_user_balances WHERE user_id = ?', [userId]);
    res.json({ success: true, newBalance: balanceInfo.settled_balance, hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Anti-Accident SOS Emergency Respite Dispatch
app.post('/api/sos', async (req, res) => {
  try {
    const dispatchCode = `SOS-${Date.now().toString(36).toUpperCase()}`;
    const userId = defaultUserId;

    await dbRun(`
      INSERT INTO sos_dispatches (dispatch_code, user_id, cluster, overdraft_hours_drawn, broadcast_recipients_count, status)
      VALUES (?, ?, 'Indiranagar Care Circle, Bengaluru', 3.0, 3, 'dispatched')
    `, [dispatchCode, userId]);

    // Ledger record
    const txId = `tx-sos-${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(dispatchCode).digest('hex').substring(0, 16)}`;

    await dbRun(`
      INSERT INTO ledger_entries (transaction_id, user_id, entry_type, amount, task_id, tier, description, counterparty, status, cryptographic_hash)
      VALUES (?, ?, 'DEBIT', 0.00, NULL, 'Tier 2 SOS Emergency', 'Emergency Respite Dispatch (3.0h Community Overdraft Reserve)', 'Broadcast: 3 Verified Caregivers', 'escrow', ?)
    `, [txId, userId, hash]);

    res.json({ success: true, dispatchCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Full Database Raw Table Dump for In-Browser Database Inspector
app.get('/api/database/dump', async (req, res) => {
  try {
    const users = await dbAll('SELECT * FROM users');
    const tasks = await dbAll('SELECT * FROM tasks');
    const ledger = await dbAll('SELECT * FROM ledger_entries ORDER BY id DESC');
    const waivers = await dbAll('SELECT * FROM waivers');
    const balances = await dbAll('SELECT * FROM vw_user_balances');
    const dispatches = await dbAll('SELECT * FROM sos_dispatches');

    res.json({
      dbFile: 'database/kintime.db',
      tables: {
        users,
        tasks,
        ledger_entries: ledger,
        waivers,
        vw_user_balances: balances,
        sos_dispatches: dispatches
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 KinTime SQLite API Server running on http://localhost:${PORT}`);
  console.log(`📂 SQLite database location: ${DB_PATH}`);
});
