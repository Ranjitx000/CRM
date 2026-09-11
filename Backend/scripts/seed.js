require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_erp?replicaSet=rs0';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Cleared existing users');

    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', passwordHash },
      { name: 'Sales User', email: 'sales@example.com', role: 'SALES', passwordHash },
      { name: 'Warehouse User', email: 'warehouse@example.com', role: 'WAREHOUSE', passwordHash },
      { name: 'Accounts User', email: 'accounts@example.com', role: 'ACCOUNTS', passwordHash }
    ];

    await User.insertMany(users);
    console.log('Inserted seed users successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
