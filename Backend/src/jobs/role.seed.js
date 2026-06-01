import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import pool from '../config/db.config.js';

// Resolve environmental config relative to the script context location
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Define structural system baseline roles inside an array layout
const DEFAULT_ROLES = [
    {
        name: 'user',
        description: 'Standard customer account with permissions to buy, sell, deposit, and withdraw digital assets.'
    },
    {
        name: 'trader',
        description: 'Advanced retail or institutional account with access to high-frequency APIs and specialized margin tools.'
    },
    {
        name: 'support',
        description: 'Internal staff role with read-only access to customer audit logs and permissions to manage support tickets.'
    },
    {
        name: 'admin',
        description: 'Superuser administrative account with absolute access control over financial ledgers, system settings, and infrastructure.'
    }
];

async function seedRoles() {
    console.log('🌱 Initializing Crypto Exchange Role Seeding Sequence...');
    
    const client = await pool.connect();

    try {
        console.log('🔄 Opening isolated transaction block...');
        await client.query('BEGIN');

        // Parameterized upsert query string to avoid duplicate errors on repeat runs
        const upsertQuery = `
            INSERT INTO roles (name, description) 
            VALUES ($1, $2)
            ON CONFLICT (name) DO NOTHING;
        `;

        // Iterate through definitions dynamically using parameterized inputs
        for (const role of DEFAULT_ROLES) {
            console.log(`⚡ Injecting system default role: [${role.name}]`);
            await client.query(upsertQuery, [role.name, role.description]);
        }

        await client.query('COMMIT');
        console.log('✨ SUCCESS: Core system roles seeded smoothly inside your Neon instance!');
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

seedRoles();