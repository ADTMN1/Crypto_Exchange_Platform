import dotenv from 'dotenv';
import path from 'path';
import { query, pool } from './src/config/db.config.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const listUsers = async () => {
  console.log('🔍 Listing all users...');
  
  try {
    const userResult = await query(`
      SELECT id, email, username, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    console.log('\n👥 All Users:');
    userResult.rows.forEach(row => {
      console.log(`- User ID: ${row.id}`);
      console.log(`  Username: ${row.username}`);
      console.log(`  Email: ${row.email}`);
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
