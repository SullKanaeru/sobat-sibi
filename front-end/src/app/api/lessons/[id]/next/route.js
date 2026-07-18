import { NextResponse } from "next/server";
import prisma from "@/server/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get current lesson
    const currentLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            level: true
          }
        }
      }
    });

    if (!currentLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Try finding next lesson in the SAME module
    const nextLessonInModule = await prisma.lesson.findFirst({
      where: {
        module_id: currentLesson.module_id,
        lesson_order: {
          gt: currentLesson.lesson_order
        }
      },
      orderBy: {
        lesson_order: 'asc'
      }
    });

    if (nextLessonInModule) {
      return NextResponse.json({ 
        nextLesson: nextLessonInModule, 
        isNewModule: false 
      }, { status: 200 });
    }

    // If no next lesson in same module, find next module in SAME level
    const nextModuleInLevel = await prisma.module.findFirst({
      where: {
        level_id: currentLesson.module.level_id,
        module_order: {
          gt: currentLesson.module.module_order
        }
      },
      orderBy: {
        module_order: 'asc'
      },
      include: {
        lessons: {
          orderBy: { lesson_order: 'asc' },
          take: 1
        }
      }
    });

    if (nextModuleInLevel && nextModuleInLevel.lessons.length > 0) {
      return NextResponse.json({ 
        nextLesson: nextModuleInLevel.lessons[0], 
        isNewModule: true,
        nextModule: nextModuleInLevel
      }, { status: 200 });
    }

    // If no next module in same level, find next level
    const nextLevel = await prisma.curriculumLevel.findFirst({
      where: {
        level_order: {
          gt: currentLesson.module.level.level_order
        }
      },
      orderBy: {
        level_order: 'asc'
      },
      include: {
        modules: {
          orderBy: { module_order: 'asc' },
          take: 1,
          include: {
            lessons: {
              orderBy: { lesson_order: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    if (nextLevel && nextLevel.modules.length > 0 && nextLevel.modules[0].lessons.length > 0) {
      return NextResponse.json({
        nextLesson: nextLevel.modules[0].lessons[0],
        isNewModule: true,
        isNewLevel: true,
        nextModule: nextLevel.modules[0]
      }, { status: 200 });
    }

    // Absolutely no next lesson (completed all levels)
    return NextResponse.json({ nextLesson: null }, { status: 200 });

  } catch (error) {
    console.error("GET Next Lesson error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
