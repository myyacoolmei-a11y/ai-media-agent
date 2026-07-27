import { NextResponse } from "next/server";
import { z } from "zod";

import { mockTasks } from "@/lib/mock-data";

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  mediaId: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = createTaskSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid workflow request", issues: payload.error.issues },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      mode: "mock",
      projectId: payload.data.projectId,
      tasks: mockTasks.map((task) => ({ ...task, status: "queued", progress: 0 })),
    },
    { status: 202 },
  );
}
