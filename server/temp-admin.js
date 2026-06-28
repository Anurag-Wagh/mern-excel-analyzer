const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeFirstUserAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first user
    const firstUser = await User.findOne().sort({ createdAt: 1 });
    
    if (!firstUser) {
      console.log('No users found in database');
      return;
    }

    console.log('Found user:', {
      id: firstUser._id,
      name: firstUser.name,
      email: firstUser.email,
      currentRole: firstUser.role
    });

    // Update to admin
    firstUser.role = 'admin';
    await firstUser.save();

    console.log('Successfully promoted user to admin');
    console.log('Updated user:', {
      id: firstUser._id,
      name: firstUser.name,
      email: firstUser.email,
      role: firstUser.role
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

makeFirstUserAdmin(); 