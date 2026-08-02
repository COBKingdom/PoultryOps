import { NextResponse } from "next/server";
import { createUser } from "@/lib/users/create-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      fullName,
      farmId,
      role = "data_entry",
      permissions = [],
      sendInvitation = false,
      invitedBy,
    } = body;

    if (!email || !password || !farmId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName, farmId" },
        { status: 400 }
      );
    }

    const result = await createUser({
      email,
      password,
      fullName,
      farmId,
      role,
      permissions,
      sendInvitation,
      invitedBy,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      invitationId: result.invitationId,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
