import dotenv from 'dotenv';
import path from 'path';
import { query, pool } from './src/config/db.config.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const listUsers = async () => {
  console.log('🔍 Listing all users...');
  
  try {
    const userResult = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.username, 
        u.is_active, 
        u.is_deleted,
        r.name AS role_name,
        us.account_status,
        us.email_verified,
        us.phone_verified,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_status us ON u.id = us.user_id
      ORDER BY u.created_at DESC
    `);

    console.log('\n👥 All Users:');
    userResult.rows.forEach(row => {
      console.log(`- User ID: ${row.id}`);
      console.log(`  Username: ${row.username}`);
      console.log(`  Email: ${row.email}`);
      console.log(`  Is Active: ${row.is_active}`);
      console.log(`  Is Deleted: ${row.is_deleted}`);
      console.log(`  Role: ${row.role_name}`);
      console.log(`  Account Status: ${row.account_status}`);
      console.log(`  Email Verified: ${row.email_verified}`);
      console.log(`  Phone Verified: ${row.phone_verified}`);
      console.log(`  Created: ${row.created_at}`);
      console.log('---');
    });

    console.log('\n✅ Complete!');

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await pool.end();
  }
};

listUsers();
