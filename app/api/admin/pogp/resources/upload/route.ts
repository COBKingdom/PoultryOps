
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "pogp-resources";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_FILES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  mp4: ["video/mp4"],
  webm: ["video/webm"],
};

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin(request);

    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.statusCode || 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Upload must use multipart/form-data" },
        { status: 415 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Please select a file to upload" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Files must not exceed 20 MB" },
        { status: 413 }
      );
    }

    const originalName = file.name.trim();

    if (
      !originalName ||
      originalName.length > 255 ||
      /[/\\\0-\x1f\x7f]/.test(originalName)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid filename" },
        { status: 400 }
      );
    }

    const extension = originalName.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_FILES[extension]) {
      return NextResponse.json(
        { success: false, error: "This file type is not allowed" },
        { status: 415 }
      );
    }

    const allowedMimeTypes = ALLOWED_FILES[extension];
    const mimeType = file.type.toLowerCase();

    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "The file extension and content type do not match",
        },
        { status: 415 }
      );
    }

    // Use a server-generated path and never trust a path supplied by the client.
    const storagePath =
      `${auth.user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: mimeType,
        cacheControl: "60",
        upsert: false,
      });

    if (uploadError) {
      console.error("POGP resource upload failed:", uploadError);

      return NextResponse.json(
        { success: false, error: "Unable to upload file" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        file: {
          storage_path: storagePath,
          original_name: originalName,
          content_type: mimeType,
          size: file.size,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POGP resource upload error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to process upload" },
      { status: 500 }
    );
  }
}
