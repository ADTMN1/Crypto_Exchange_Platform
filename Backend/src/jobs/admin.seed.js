import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from '../config/db.config.js';

// Resolve environmental config relative to the script context location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Default admin credentials (CHANGE THESE IN PRODUCTION!)
const DEFAULT_ADMIN = {
    email: 'admin@cryptoexchange.com',
    username: 'Admin User',
    phone_number: '+1234567890',
    password: 'Admin@123456', // Strong password with uppercase, lowercase, number, and special char
};

async function seedAdmin() {
    console.log('🔐 Initializing Admin User Seeding Sequence...');
    
    const client = await pool.connect();

    try {
        console.log('🔄 Opening isolated transaction block...');
        await client.query('BEGIN');

        // 1. Get the 'admin' role UUID
        const roleQuery = await client.query(
            "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
        );
        
        if (roleQuery.rows.length === 0) {
            throw new Error('Admin role not found. Please run role seeding first: npm run seed:roles');
        }
        
        const adminRoleId = roleQuery.rows[0].id;
        console.log(`✅ Admin role found: ${adminRoleId}`);

        // 2. Check if admin user already exists
        const existingAdmin = await client.query(
            'SELECT id, email FROM users WHERE email = $1 OR role_id = $2',
            [DEFAULT_ADMIN.email, adminRoleId]
        );

        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  Admin user already exists. Skipping creation.');
            console.log(`   Email: ${existingAdmin.rows[0].email}`);
            await client.query('ROLLBACK');
            return;
        }

        // 3. Hash the password
        console.log('🔒 Hashing admin password...');
        const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

        // 4. Create admin user
        console.log('⚡ Creating admin user...');
        const userInsertQuery = `
            INSERT INTO users (email, username, phone_number, password_hash, role_id, is_active)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            RETURNING id, email, username, created_at;
        `;
        const userResult = await client.query(userInsertQuery, [
            DEFAULT_ADMIN.email,
            DEFAULT_ADMIN.username,
            DEFAULT_ADMIN.phone_number,
            passwordHash,
            adminRoleId
        ]);
        const newAdmin = userResult.rows[0];
        console.log(`✅ Admin user created: ${newAdmin.email} (ID: ${newAdmin.id})`);

        // 5. Create user status (active and email verified)
        console.log('⚡ Creating admin user status...');
        const statusInsertQuery = `
            INSERT INTO user_status (user_id, account_status, email_verified, phone_verified, two_fa_enabled)
            VALUES ($1, 'active', TRUE, TRUE, FALSE);
        `;
        await client.query(statusInsertQuery, [newAdmin.id]);
        console.log('✅ Admin status created');

        await client.query('COMMIT');
        console.log('\n✨ SUCCESS: Admin user seeded successfully!');
        console.log('\n📋 Admin Credentials (CHANGE IN PRODUCTION!):');
        console.log(`   Email: ${DEFAULT_ADMIN.email}`);
        console.log(`   Password: ${DEFAULT_ADMIN.password}`);
        console.log('\n⚠️  SECURITY WARNING: Change the admin password immediately after first login!\n');
    } catch (error) {
        console.error('🛑 CRITICAL SEED FAILURE: Rolling back database changes...');
        console.error(`Reason: ${error.message}`);
        
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error(`Failed to rollback cleanly: ${rollbackError.message}`);
        }
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        console.log('🛑 Database connection engine closed cleanly.');
    }
}

seedAdmin();
