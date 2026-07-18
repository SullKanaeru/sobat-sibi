import prisma from './src/server/db.js';
import { comparePassword } from './src/server/auth.js';

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'zulhanarif77@gmail.com' }
  });
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  console.log("User found:", user.username, user.email);
  const isValid = await comparePassword('Zulhan123', user.password);
  console.log("Password valid for Zulhan123:", isValid);
}
check().catch(console.error).finally(() => process.exit(0));
