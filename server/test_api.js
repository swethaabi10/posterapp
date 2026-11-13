const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🚀 Starting Backend Integration Tests...\n');
  let token = null;

  try {
    // 1. Register test user
    console.log('📝 Test 1: Register user...');
    const regRes = await request('POST', '/auth/register', {
      name: 'Test Owner',
      email: 'test@goldshop.com',
      password: 'password123',
      shopName: 'Golden Palace Jewelry'
    });
    console.log('Status:', regRes.statusCode);
    console.log('Response:', regRes.body);
    if (regRes.statusCode !== 201 || !regRes.body.success) {
      throw new Error('Registration failed');
    }
    token = regRes.body.token;
    console.log('✅ Registration Passed.\n');

    // 2. Login test user
    console.log('🔑 Test 2: Login user...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'test@goldshop.com',
      password: 'password123'
    });
    console.log('Status:', loginRes.statusCode);
    console.log('Response:', loginRes.body);
    if (loginRes.statusCode !== 200 || !loginRes.body.success) {
      throw new Error('Login failed');
    }
    token = loginRes.body.token; // update token just in case
    console.log('✅ Login Passed.\n');

    // 3. Get profile
    console.log('👤 Test 3: Get User Profile...');
    const profileRes = await request('GET', '/user/profile', null, token);
    console.log('Status:', profileRes.statusCode);
    console.log('Response:', profileRes.body);
    if (profileRes.statusCode !== 200 || !profileRes.body.success) {
      throw new Error('Get profile failed');
    }
    console.log('✅ Get Profile Passed.\n');

    // 4. Update profile
    console.log('👤 Test 4: Update User Profile...');
    const updateRes = await request('PUT', '/user/profile', {
      ownerName: 'Alexander the Great',
      shopAddress: '123 Golden Avenue, Gold City',
      shopPhone: '+1234567890',
      whatsappNumber: '1234567890',
      logoUrl: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=200'
    }, token);
    console.log('Status:', updateRes.statusCode);
    console.log('Response:', updateRes.body);
    if (updateRes.statusCode !== 200 || !updateRes.body.success) {
      throw new Error('Update profile failed');
    }
    if (updateRes.body.user.ownerName !== 'Alexander the Great') {
      throw new Error('Profile update validation failed');
    }
    console.log('✅ Update Profile Passed.\n');

    // 5. Get today's template
    console.log('📅 Test 5: Get Today\'s Template...');
    const tempRes = await request('GET', '/templates/today', null, token);
    console.log('Status:', tempRes.statusCode);
    console.log('Response:', tempRes.body);
    if (tempRes.statusCode !== 200 || !tempRes.body.success) {
      throw new Error('Get today\'s template failed');
    }
    const templateId = tempRes.body.template._id;
    console.log('✅ Get Today\'s Template Passed.\n');

    // 6. Update today's template rates
    console.log('📈 Test 6: Generate/Update Today\'s Rates...');
    const ratesRes = await request('POST', '/templates/generate', {
      gold22k: 6650,
      gold24k: 7250,
      silverRate: 88,
      templateStyle: 'premium'
    }, token);
    console.log('Status:', ratesRes.statusCode);
    console.log('Response:', ratesRes.body);
    if (ratesRes.statusCode !== 200 || !ratesRes.body.success) {
      throw new Error('Update rates failed');
    }
    if (ratesRes.body.template.gold22k !== 6650 || ratesRes.body.template.templateStyle !== 'premium') {
      throw new Error('Rates values validation failed');
    }
    console.log('✅ Update Today\'s Rates Passed.\n');

    // 7. Save poster to history
    console.log('💾 Test 7: Save Poster to History...');
    const saveRes = await request('POST', '/posters/save', {
      templateId,
      date: ratesRes.body.template.date,
      gold22k: 6650,
      gold24k: 7250,
      silverRate: 88,
      shopName: 'Golden Palace Jewelry',
      shopPhone: '+1234567890',
      templateStyle: 'premium',
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }, token);
    console.log('Status:', saveRes.statusCode);
    console.log('Response:', saveRes.body);
    if (saveRes.statusCode !== 201 || !saveRes.body.success) {
      throw new Error('Save poster failed');
    }
    console.log('✅ Save Poster Passed.\n');

    // 8. Get history
    console.log('📜 Test 8: Get Poster History...');
    const historyRes = await request('GET', '/posters/history?page=1&limit=5', null, token);
    console.log('Status:', historyRes.statusCode);
    console.log('Response:', historyRes.body);
    if (historyRes.statusCode !== 200 || !historyRes.body.success) {
      throw new Error('Get poster history failed');
    }
    if (historyRes.body.posters.length === 0) {
      throw new Error('History list is empty');
    }
    console.log('✅ Get Poster History Passed.\n');

    console.log('🏆 ALL BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ Integration Tests Failed:', error.message);
    process.exit(1);
  }
};

runTests();
