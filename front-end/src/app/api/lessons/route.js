import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyToken } from "@/server/jwt";

export async function GET(request) {
  try {
    // Determine if user is logged in
    let userId = null;
    const tokenCookie = request.cookies.get("token");
    if (tokenCookie) {
      const payload = await verifyToken(tokenCookie.value);
      if (payload && payload.userId) {
        userId = payload.userId;
      }
    }

    const levels = await prisma.curriculumLevel.findMany({
      orderBy: { level_order: 'asc' },
      include: {
        modules: {
          orderBy: { module_order: 'asc' },
          include: {
            lessons: {
              orderBy: { lesson_order: 'asc' }
            }
          }
        }
      }
    });

    let completedLessonIds = [];
    if (userId) {
      const progress = await prisma.userLessonProgress.findMany({
        where: { user_id: userId },
        select: { lesson_id: true }
      });
      completedLessonIds = progress.map(p => p.lesson_id);
    }

    return NextResponse.json({ levels, completedLessonIds }, { status: 200 });
  } catch (error) {
    console.error("GET Lessons error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
