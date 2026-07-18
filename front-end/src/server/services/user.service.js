// src/services/user.service.js
import prisma from "@/server/db";
import { hashPassword } from "@/server/auth";

export async function createUser(data) {
  const hashedPassword = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      profile_picture: true,
      created_at: true,
    },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      user_learned_signs: {
        include: {
          dictionary: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function updateUser(id, data) {
  const updateData = { ...data };

  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      profile_picture: true,
      updated_at: true,
    },
  });
}

export async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}
