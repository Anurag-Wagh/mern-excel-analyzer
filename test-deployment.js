const axios = require('axios');

// Configuration - Update these URLs with your actual deployment URLs
const BACKEND_URL = 'https://mern-excel-analyzer.onrender.com'; // Updated backend URL
const FRONTEND_URL = 'https://mern-excel-analyzer.vercel.app'; // Updated frontend URL

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

async function testDeployment() {
  console.log('🚀 Testing Deployment...\n');

  try {
    // 1. Test Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // 2. Test Registration
    console.log('2. Testing Registration...');
    try {
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
      console.log('✅ Registration successful');
      console.log('Token received:', registerResponse.data.token ? 'Yes' : 'No');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.msg === 'User already exists') {
        console.log('⚠️  User already exists, proceeding to login...');
      } else {
        console.log('❌ Registration failed:', error.response?.data || error.message);
      }
    }
    console.log('');

    // 3. Test Login
    console.log('3. Testing Login...');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      console.log('Token received:', token ? 'Yes' : 'No');
      console.log('');

      // 4. Test Protected Route
      console.log('4. Testing Protected Route...');
      try {
        const protectedResponse = await axios.get(`${BACKEND_URL}/api/protected`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Protected route accessible');
        console.log('User data:', protectedResponse.data.user);
      } catch (error) {
        console.log('❌ Protected route failed:', error.response?.data || error.message);
      }
      console.log('');

      // 5. Test Profile Fetch
      console.log('5. Testing Profile Fetch...');
      try {
        const profileResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Profile fetch successful');
        console.log('User profile:', {
          id: profileResponse.data._id,
          name: profileResponse.data.name,
          email: profileResponse.data.email,
          role: profileResponse.data.role
        });
      } catch (error) {
        console.log('❌ Profile fetch failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Health check failed - Server might be down or URL incorrect');
    console.log('Error:', error.message);
    console.log('\nPlease check:');
    console.log('1. Backend URL is correct');
    console.log('2. Server is running');
    console.log('3. Environment variables are set');
  }
}

// Environment variable check
console.log('🔧 Environment Check:');
console.log('Backend URL:', BACKEND_URL);
console.log('Frontend URL:', FRONTEND_URL);
console.log('');

// Run tests
testDeployment().catch(console.error);