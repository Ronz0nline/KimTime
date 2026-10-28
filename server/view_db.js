import { initDatabase, dbAll, dbGet } from './db.js';

async function viewDatabase() {
  await initDatabase();
  console.log('\n================================================================');
  console.log('📦 KinTime SQLite Database Inspection (database/kintime.db)');
  console.log('================================================================\n');

  console.log('--- 1. COMPUTED USER BALANCES (vw_user_balances view) ---');
  const balances = await dbAll('SELECT * FROM vw_user_balances');
  console.table(balances);

  console.log('\n--- 2. APPEND-ONLY DOUBLE-ENTRY LEDGER (ledger_entries) ---');
  const ledger = await dbAll('SELECT id, transaction_id, user_id, entry_type, amount, tier, status, cryptographic_hash, created_at FROM ledger_entries ORDER BY id DESC');
  console.table(ledger);

  console.log('\n--- 3. CARE EXCHANGE TASKS (tasks) ---');
  const tasks = await dbAll('SELECT id, title, tier, hours, requester_name, status FROM tasks');
  console.table(tasks);

  console.log('\n--- 4. USERS & PERSONAS (users table - all profile details stored in SQLite) ---');
  const users = await dbAll('SELECT id, name, role, role_label, cluster, phone, email, aadhaar_number, kyc_status, pledge_agreed, created_at FROM users');
  console.table(users);

  process.exit(0);
}

viewDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
