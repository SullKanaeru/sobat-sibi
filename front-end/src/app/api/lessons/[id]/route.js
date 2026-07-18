import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyToken } from "@/server/jwt";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    let userId = null;
    const tokenCookie = request.cookies.get("token");
    if (tokenCookie) {
      const payload = await verifyToken(tokenCookie.value);
      if (payload && payload.userId) {
        userId = payload.userId;
      }
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            level: true,
            lessons: {
              orderBy: { lesson_order: 'asc' }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    
    let completedLessonIds = [];
    if (userId) {
      const progress = await prisma.userLessonProgress.findMany({
        where: { 
          user_id: userId,
          lesson_id: { in: lesson.module.lessons.map(l => l.id) }
        },
        select: { lesson_id: true }
      });
      completedLessonIds = progress.map(p => p.lesson_id);
    }

    return NextResponse.json({ lesson, completedLessonIds }, { status: 200 });
  } catch (error) {
    console.error("GET Lesson by ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
