import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyToken } from "@/server/jwt";

async function getUserIdFromRequest(request) {
  const tokenCookie = request.cookies.get("token");
  if (!tokenCookie) return null;
  
  const payload = await verifyToken(tokenCookie.value);
  if (!payload || !payload.userId) return null;
  
  return payload.userId;
}

export async function POST(request, { params }) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    // If not logged in, just return 200 OK (guest mode, progress not saved)
    if (!userId) {
      return NextResponse.json({ message: "Guest mode, progress not saved" }, { status: 200 });
    }

    const { id } = await params;

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Upsert the progress
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: id
        }
      },
      update: {
        completed_at: new Date()
      },
      create: {
        user_id: userId,
        lesson_id: id,
        completed_at: new Date()
      }
    });

    return NextResponse.json({ message: "Progress saved", progress }, { status: 200 });
  } catch (error) {
    console.error("POST Lesson Complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
