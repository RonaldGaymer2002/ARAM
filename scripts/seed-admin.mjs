#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Helper to load and parse .env files if they exist (without external dependencies)
const loadedKeys = new Set();
const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        
        if (!process.env[key] || loadedKeys.has(key)) {
          process.env[key] = val;
          loadedKeys.add(key);
        }
      }
    });
  }
};

// Load environment files from lowest to highest priority
loadEnv(path.resolve('apps/web/.env'));
loadEnv(path.resolve('apps/web/.env.local'));
loadEnv(path.resolve('.env'));
loadEnv(path.resolve('.env.local'));

const email = (process.env.ADMIN_EMAIL ?? 'admin@fundares.org').toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
const nombre = process.env.ADMIN_NAME ?? 'Administrador';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(databaseUrl);
const passwordHash = await bcrypt.hash(password, 12);

const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

if (existing.length > 0) {
  console.log(`Admin user already exists: ${email}`);
  process.exit(0);
}

const users = await sql`
  INSERT INTO users (email, password_hash)
  VALUES (${email}, ${passwordHash})
  RETURNING id
`;

const userId = users[0].id;

await sql`
  INSERT INTO perfiles (id, rol, nombre)
  VALUES (${userId}, 'admin', ${nombre})
`;

console.log('Admin user created successfully');
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
