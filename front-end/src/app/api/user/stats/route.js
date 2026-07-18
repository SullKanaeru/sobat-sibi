export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { verifyToken } from "@/server/jwt";

export async function GET(request) {
  try {
    let userId = null;
    const tokenCookie = request.cookies.get("token");
    if (tokenCookie) {
      const payload = await verifyToken(tokenCookie.value);
      if (payload && payload.userId) {
        userId = payload.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Total Isyarat Dikuasai (Learned Signs via UserLessonProgress)
    const learnedCount = await prisma.userLessonProgress.count({
      where: { user_id: userId }
    });

    // 2. Total Pelajaran (Lessons) di database
    const totalLessons = await prisma.lesson.count();

    // 3. Modul Selesai (Modules where all lessons are completed)
    const modules = await prisma.module.findMany({
      include: {
        lessons: {
          select: { id: true }
        }
      }
    });

    const userProgress = await prisma.userLessonProgress.findMany({
      where: { user_id: userId },
      select: { lesson_id: true }
    });
    
    const completedLessonIds = new Set(userProgress.map(p => p.lesson_id));

    let completedModulesCount = 0;
    for (const mod of modules) {
      const lessonIds = mod.lessons.map(l => l.id);
      if (lessonIds.length > 0 && lessonIds.every(id => completedLessonIds.has(id))) {
        completedModulesCount++;
      }
    }

    return NextResponse.json({
      learnedCount,
      totalLessons,
      completedModulesCount,
      totalModules: modules.length,
      percentage: totalLessons > 0 ? Math.round((learnedCount / totalLessons) * 100) : 0
    }, { status: 200 });

  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
