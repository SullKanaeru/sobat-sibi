// src/server/auth.js
import bcrypt from "bcrypt";
// Catatan: Fungsi JWT dipindahkan ke src/server/jwt.js agar aman di Edge Runtime (Middleware)

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}
