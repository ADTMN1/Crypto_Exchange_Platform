/**
 * Quick test script for Trading Pairs API
 * Run with: node test-pairs-api.js
 * 
 * Make sure the backend server is running on port 5000
 */

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (adjust as needed)
const ADMIN_EMAIL = 'admin@cryptoexchange.com';
const ADMIN_PASSWORD = 'Admin@123456';

let authToken = '';

async function login() {
  console.log('🔐 Logging in as admin...');
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  const data = await response.json();
  if (data.success && data.data.token) {
    authToken = data.data.token;
    console.log('✅ Login successful\n');
    return true;
  } else {
    console.error('❌ Login failed:', data.message);
    return false;
  }
}

async function testGetAllPairs() {
  console.log('📋 Testing GET /api/admin/pairs...');
  const response = await fetch(`${BASE_URL}/admin/pairs?includeInactive=true`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('✅ Found', data.data?.length || 0, 'pairs\n');
  return data.data || [];
}

async function testGetEnabledPairs() {
  console.log('📋 Testing GET /api/trading/pairs (user endpoint)...');
  const response = await fetch(`${BASE_URL}/trading/pairs`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('✅ Found', data.data?.length || 0, 'enabled pairs\n');
}

async function testCreatePair() {
  console.log('➕ Testing POST /api/admin/pairs...');
  const response = await fetch(`${BASE_URL}/admin/pairs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_currency: 'LTC',
      quote_currency: 'USDT',
      min_order_size: '0.01',
      max_order_size: '10000',
      price_precision: 2,
      qty_precision: 8,
      maker_fee: '0.0010',
      taker_fee: '0.0010',
      is_active: true,
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log('✅ Pair created successfully\n');
    return data.data;
  } else {
    console.log('ℹ️ ', data.message, '\n');
    return null;
  }
}

async function testToggleStatus(pairId) {
  console.log('🔄 Testing PATCH /api/admin/pairs/:id/status...');
  
  // Disable
  let response = await fetch(`${BASE_URL}/admin/pairs/${pairId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: false }),
  });

  let data = await response.json();
  console.log('Disabled:', data.success);

  // Enable again
  response = await fetch(`${BASE_URL}/admin/pairs/${pairId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: true }),
  });

  data = await response.json();
  console.log('Enabled:', data.success);
  console.log('✅ Status toggle working\n');
}

async function runTests() {
  console.log('🧪 Testing Trading Pairs API\n');
  console.log('==========================================\n');

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Cannot proceed without login');
    return;
  }

  // Get all pairs
  const pairs = await testGetAllPairs();

  // Get enabled pairs (user endpoint)
  await testGetEnabledPairs();

  // Create a test pair
  const newPair = await testCreatePair();

  // Toggle status if we have a pair
  if (pairs.length > 0) {
    await testToggleStatus(pairs[0].id);
  } else if (newPair) {
    await testToggleStatus(newPair.id);
  }

  console.log('==========================================');
  console.log('✅ All tests completed!');
}

runTests().catch(console.error);
