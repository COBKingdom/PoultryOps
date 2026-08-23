import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  const result = await requirePlatformAdmin(request);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      {
        status: result.statusCode || 403,
      }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Platform admin authorization successful",
    admin: {
      userId: result.admin?.userId,
      email: result.admin?.email,
      role: result.admin?.adminRole,
    },
  });
}
