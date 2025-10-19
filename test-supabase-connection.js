/**
 * Test Supabase Connection
 * 
 * Run this with: node test-supabase-connection.js
 * 
 * This will verify:
 * 1. Environment variables are loaded
 * 2. Supabase client can connect
 * 3. Tables exist and are accessible
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Step 1: Check environment variables
console.log('Step 1: Checking environment variables...');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.log('SUPABASE_URL:', SUPABASE_URL || '(not set)');
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '(present)' : '(not set)');
  process.exit(1);
}
console.log('✅ Environment variables loaded');
console.log('   URL:', SUPABASE_URL);
console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

// Step 2: Create Supabase client
console.log('Step 2: Creating Supabase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase client created\n');

// Step 3: Test connection by listing tables
async function testConnection() {
  console.log('Step 3: Testing connection to database...\n');
  
  try {
    // Test users table
    console.log('📋 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
      console.error('   Details:', usersError);
    } else {
      console.log(`✅ Users table accessible (${users.length} users found)`);
      if (users.length > 0) {
        console.log('   Sample user:', users[0].email || users[0].id);
      }
    }
    
    // Test user_stats table
    console.log('\n📊 Checking user_stats table...');
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .limit(5);
    
    if (statsError) {
      console.error('❌ Error accessing user_stats table:', statsError.message);
      console.error('   Details:', statsError);
    } else {
      console.log(`✅ User_stats table accessible (${stats.length} stats found)`);
    }
    
    // Test bookmarks table
    console.log('\n🔖 Checking bookmarks table...');
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(5);
    
    if (bookmarksError) {
      console.error('❌ Error accessing bookmarks table:', bookmarksError.message);
      console.error('   Details:', bookmarksError);
    } else {
      console.log(`✅ Bookmarks table accessible (${bookmarks.length} bookmarks found)`);
    }
    
    // Test auth users
    console.log('\n👤 Checking authentication users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️  Cannot access auth users (requires service_role key, not anon key)');
      console.log('   This is normal - only checking table data is important');
    } else {
      console.log(`✅ Auth users accessible (${authUsers.length} users found)`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Connection test complete!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testConnection();

