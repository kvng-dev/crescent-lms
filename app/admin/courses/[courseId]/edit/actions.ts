"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import prisma from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
  LessonSchemaType,
} from "@/lib/zodSchema";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    })
  );
export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session?.user.id as string,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have exceeded the rate limit. Please try again later.",
        };
      } else {
        return {
          status: "error",
          message: "Bot detected or request denied.",
        };
      }
    }
    const result = courseSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Validation failed",
      };
    }

    await prisma.course.update({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      data: {
        ...result.data,
      },
    });
    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "An error occurred while updating the course",
    };
  }
}

export async function reOrderedLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "Failed to reorder lessons.",
      };
    }
    const update = lessons.map((lesson) =>
      prisma.lesson.update({
        where: { id: lesson.id, chapterId: chapterId },
        data: {
          position: lesson.position,
        },
      })
    );
    await prisma.$transaction(update);
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return {
      status: "success",
      message: "Lessons reordered successfully.",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Failed to reorder lessons.",
    };
  }
}

export async function reOrderChapter(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "Failed to reorder chapters.",
      };
    }
    const update = chapters.map((chapter) =>
      prisma.chapter.update({
        where: { id: chapter.id, courseId: courseId },
        data: {
          position: chapter.position,
        },
      })
    );
    await prisma.$transaction(update);
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return {
      status: "success",
      message: "Chapters reordered successfully.",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters.",
    };
  }
}

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Validation failed",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });
      await tx.chapter.create({
        data: {
          title: result.data.name,
          position: (maxPos?.position ?? 0) + 1,
          courseId: result.data.courseId,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);
    return {
      status: "success",
      message: "Chapter created successfully.",
    };
  } catch (error) {
    console.error("Error creating chapter:", error);
    return {
      status: "error",
      message: "Failed to create chapter.",
    };
  }
}

export async function createLesson(
  values: LessonSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Validation failed",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });
      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          position: (maxPos?.position ?? 0) + 1,
          chapterId: result.data.chapterId,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);
    return {
      status: "success",
      message: "Lesson created successfully.",
    };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return {
      status: "error",
      message: "Failed to create lesson.",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          select: {
            id: true,
            position: true,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found.",
      };
    }

    const lessons = chapterWithLessons.lessons;
    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);
    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found.",
      };
    }

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return {
      status: "success",
      message: "Lesson deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return {
      status: "error",
      message: "Failed to delete lesson.",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const courseWithChapters = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        chapters: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not found.",
      };
    }

    const chapters = courseWithChapters.chapters;
    const chapterToDelete = chapters.find(
      (chapter) => chapter.id === chapterId
    );
    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found.",
      };
    }

    const remainingChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId
    );

    const updates = remainingChapters.map((chapter, index) => {
      return prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return {
      status: "success",
      message: "Chapter deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return {
      status: "error",
      message: "Failed to delete lesson.",
    };
  }
}
