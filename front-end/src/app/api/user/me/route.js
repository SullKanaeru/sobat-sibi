export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getUserById, updateUser } from "@/server/services/user.service";
import { verifyToken } from "@/server/jwt";

// Helper function to get user ID from cookie
async function getUserIdFromRequest(request) {
  const tokenCookie = request.cookies.get("token");
  if (!tokenCookie) return null;
  
  const payload = await verifyToken(tokenCookie.value);
  if (!payload || !payload.userId) return null;
  
  return payload.userId;
}

export async function GET(request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      profilePicture: user.profile_picture || null,
    }, { status: 200 });
  } catch (error) {
    console.error("GET User Profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, phone, email, profilePicture } = body;

    // Lakukan validasi dasar
    if (!username || !email) {
      return NextResponse.json({ error: "Username dan email tidak boleh kosong" }, { status: 400 });
    }

    const updateData = { username, phone, email };
    if (profilePicture !== undefined) {
      updateData.profile_picture = profilePicture;
    }

    const updatedUser = await updateUser(userId, updateData);

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        profilePicture: updatedUser.profile_picture || null,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("PUT User Profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
