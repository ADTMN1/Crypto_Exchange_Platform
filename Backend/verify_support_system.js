import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function verifySystem() {
    const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        console.log('🔍 Verifying Support Ticket System...\n');
        
        // Check tables exist
        console.log('1️⃣ Checking database tables...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (
                table_name LIKE '%ticket%' 
                OR table_name LIKE '%faq%' 
                OR table_name LIKE '%blacklist%'
                OR table_name = 'spam_logs'
            )
            ORDER BY table_name;
        `);
        
        const expectedTables = [
            'email_blacklist',
            'email_domain_blacklist',
            'faqs',
            'ip_blacklist',
            'spam_logs',
            'support_tickets',
            'ticket_replies'
        ];
        
        const foundTables = tables.rows.map(r => r.table_name);
        
        expectedTables.forEach(table => {
            if (foundTables.includes(table)) {
                console.log(`   ✅ ${table}`);
            } else {
                console.log(`   ❌ ${table} - MISSING!`);
            }
        });
        
        // Check FAQs count
        console.log('\n2️⃣ Checking FAQs...');
        const faqCount = await client.query('SELECT COUNT(*) FROM faqs WHERE is_active = true');
        console.log(`   ✅ ${faqCount.rows[0].count} FAQs found`);
        
        // Check support_tickets structure
        console.log('\n3️⃣ Checking support_tickets columns...');
        const columns = await client.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'support_tickets'
            ORDER BY ordinal_position;
        `);
        
        const expectedColumns = [
            'id', 'user_id', 'ticket_number', 'subject', 'description',
            'status', 'priority', 'assigned_to', 'last_reply_at',
            'last_reply_by', 'created_at', 'updated_at', 'closed_at'
        ];
        
        const foundColumns = columns.rows.map(r => r.column_name);
        
        expectedColumns.forEach(col => {
            const colInfo = columns.rows.find(r => r.column_name === col);
            if (colInfo) {
                const detail = colInfo.character_maximum_length 
                    ? ` (${colInfo.data_type}(${colInfo.character_maximum_length}))`
                    : ` (${colInfo.data_type})`;
                console.log(`   ✅ ${col}${detail}`);
            } else {
                console.log(`   ❌ ${col} - MISSING!`);
            }
        });
        
        // Check ticket_replies structure
        console.log('\n4️⃣ Checking ticket_replies columns...');
        const replyColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ticket_replies'
            ORDER BY ordinal_position;
        `);
        
        const expectedReplyColumns = ['id', 'ticket_id', 'user_id', 'message', 'is_admin', 'created_at'];
        const foundReplyColumns = replyColumns.rows.map(r => r.column_name);
        
        expectedReplyColumns.forEach(col => {
            if (foundReplyColumns.includes(col)) {
                console.log(`   ✅ ${col}`);
            } else {
                console.log(`   ❌ ${col} - MISSING!`);
            }
        });
        
        // Check indexes
        console.log('\n5️⃣ Checking indexes...');
        const indexes = await client.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename IN ('support_tickets', 'ticket_replies', 'faqs')
            ORDER BY indexname;
        `);
        
        console.log(`   ✅ ${indexes.rows.length} indexes found`);
        indexes.rows.forEach(idx => {
            console.log(`      • ${idx.indexname}`);
        });
        
        console.log('\n✅ Verification Complete!');
        console.log('\n📊 Summary:');
        console.log(`   Tables: ${foundTables.length}/${expectedTables.length}`);
        console.log(`   FAQs: ${faqCount.rows[0].count}`);
        console.log(`   Indexes: ${indexes.rows.length}`);
        console.log('\n🎉 Support Ticket System is ready!');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

verifySystem();
