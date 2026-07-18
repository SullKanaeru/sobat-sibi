import fs from 'fs';
import nodemailer from 'nodemailer';

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim().replace(/^"/, '').replace(/"$/, '');
      process.env[key] = val;
    }
  });
} catch (err) {}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log("Testing connection for:", process.env.SMTP_USER);
console.log("Host:", process.env.SMTP_HOST, "Port:", process.env.SMTP_PORT);

transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP ERROR CAUSE:", error.message);
    if (error.response) console.error("SMTP RESPONSE:", error.response);
  } else {
    console.log("SUCCESS: SMTP Config is correct!");
  }
  process.exit(error ? 1 : 0);
});
