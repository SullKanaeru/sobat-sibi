// src/server/jwt.js
import { SignJWT, jwtVerify } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return new TextEncoder().encode(secret);
};

export async function generateToken(userId, email) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Token berlaku 24 jam
    .sign(getJwtSecretKey());
  
  return token;
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}
