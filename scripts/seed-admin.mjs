#!/usr/bin/env node
/**
 * Seed the first admin user
 * Usage: node scripts/seed-admin.mjs [email] [password] [name]
 * 
 * Example:
 *   node scripts/seed-admin.mjs admin@example.com mysecretpass "Admin User"
 */

import bcrypt from 'bcrypt';
import pg from 'pg';

const { Client } = pg;

// Get args
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin';

if (!email || !password) {
  console.log(`
Usage: node scripts/seed-admin.mjs <email> <password> [name]

Example:
  node scripts/seed-admin.mjs admin@openspawn.local mysecretpass "Admin User"

Environment:
  DATABASE_URL - PostgreSQL connection string (required)
`);
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const BCRYPT_ROUNDS = 12;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔄 Connected to database...');

    // Get or create default org
    let orgResult = await client.query(`SELECT id FROM organizations LIMIT 1`);
    let orgId;

    if (orgResult.rows.length === 0) {
      console.log('📦 Creating default organization...');
      const insertOrg = await client.query(`
        INSERT INTO organizations (name, slug, task_prefix)
        VALUES ('Default', 'default', 'TASK')
        RETURNING id
      `);
      orgId = insertOrg.rows[0].id;
      console.log(`   Created org: ${orgId}`);
    } else {
      orgId = orgResult.rows[0].id;
      console.log(`📦 Using existing org: ${orgId}`);
    }

    // Check if user exists
    const existingUser = await client.query(
      `SELECT id FROM users WHERE org_id = $1 AND email = $2`,
      [orgId, email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      console.log(`⚠️  User ${email} already exists!`);
      console.log(`   ID: ${existingUser.rows[0].id}`);
      process.exit(0);
    }

    // Hash password with bcrypt
    console.log('🔐 Hashing password (bcrypt, cost 12)...');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create admin user
    console.log('👤 Creating admin user...');
    const result = await client.query(`
      INSERT INTO users (org_id, email, password_hash, name, role, email_verified)
      VALUES ($1, $2, $3, $4, 'admin', true)
      RETURNING id, email, name, role
    `, [orgId, email.toLowerCase(), passwordHash, name]);

    const user = result.rows[0];
    console.log(`
✅ Admin user created!

   ID:    ${user.id}
   Email: ${user.email}
   Name:  ${user.name}
   Role:  ${user.role}
   Org:   ${orgId}

🔑 Add this to your .env:
   DEFAULT_ORG_ID=${orgId}
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
