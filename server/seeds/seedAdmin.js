/**
 * Idempotent seed: creates the default System Admin if it doesn't exist.
 * Safe to run repeatedly. Reads credentials from env (see .env.example).
 *
 *   node seeds/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');

async function run() {
  await mongoose.connect(config.mongoUri);
  logger.info('Connected for seeding.');

  const email = config.seed.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`Seed admin already exists: ${email} (role: ${existing.role}). No changes made.`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name: config.seed.name,
    email,
    password: config.seed.password,
    phone: config.seed.phone,
    role: 'system_admin',
    isActive: true,
  });

  logger.info('Default System Admin created:');
  logger.info(`  Email   : ${admin.email}`);
  logger.info(`  Password: ${config.seed.password} (from SEED_ADMIN_PASSWORD)`);
  logger.info('  >>> Change this password after first login.');
  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
