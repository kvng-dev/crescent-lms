"use server";
import { requireAdmin } from "@/app/data/admin/require-admin";
import prisma from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchema";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Validation failed. Please check your input.",
      };
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
      },
    });
    return { status: "success", message: "Lesson updated successfully" };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to update lesson. Please try again later.",
    };
  }
}
