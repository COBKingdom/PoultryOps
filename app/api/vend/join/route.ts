import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendVendVerificationEmail } from "@/lib/email-service";

const GLOBAL_EMAIL_TAKEN_MESSAGE =
  "This email address is already registered with PoultryOps. Please use another email address.";

// PoultryOps authentication standard: minimum 8 characters
// (consistent with app/reset-password/page.tsx).
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, "");
}

/*
 * Forgiving POGP code normalization (authoritative, server-side).
 *
 * Accepts:
 *   POGP-002 -> POGP-002
 *   pogp-002 -> POGP-002
 *   002      -> POGP-002
 *   2        -> POGP-002
 *   " 002 "  -> POGP-002
 */
function normalizePogpCode(rawValue: string) {
  const cleaned = String(rawValue || "")
    .trim()
    .toUpperCase();

  if (!cleaned) return "";

  let numeric = cleaned;

  if (numeric.startsWith("POGP")) {
    numeric = numeric.slice(4);
  }

  numeric = numeric
    .replace(/^[\s\-_–—”:]+/, "")
    .trim();

  numeric = numeric.replace(/\s+/g, "");

  if (!/^\d+$/.test(numeric)) {
    return cleaned.startsWith("POGP-")
      ? cleaned
      : `POGP-${cleaned}`;
  }

  const num = parseInt(numeric, 10);

  if (!Number.isSafeInteger(num) || num < 1) {
    return "";
  }

  return `POGP-${String(num).padStart(3, "0")}`;
}

/*
 * Global email uniqueness check.
 *
 * Covers the PoultryOps identity/application-user architecture:
 * - profiles
 * - vend_partners
 * - pogp_partners
 * - Supabase Auth users
 *
 * Returns true when the email is already taken anywhere.
 * Never reveals which type of account owns the email.
 */
async function isEmailTakenGlobally(
  email: string
): Promise<boolean> {
  const {
    data: profileMatch,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profileMatch) return true;

  const {
    data: vendMatch,
    error: vendError,
  } = await supabaseAdmin
    .from("vend_partners")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (vendError) {
    throw vendError;
  }

  if (vendMatch) return true;

  const {
    data: pogpMatch,
    error: pogpError,
  } = await supabaseAdmin
    .from("pogp_partners")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (pogpError) {
    throw pogpError;
  }

  if (pogpMatch) return true;

  // Supabase Auth check — scan paginated user list
  // for a case-insensitive email match.
  const perPage = 1000;
  let page = 1;

  for (let i = 0; i < 20; i++) {
    const {
      data,
      error,
    } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];

    if (
      users.some(
        (u) =>
          String(u.email || "")
            .trim()
            .toLowerCase() === email
      )
    ) {
      return true;
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return false;
}

async function rollbackAuthUser(
  userId: string
) {
  try {
    // Remove the profile row if it was created
    // before the failure.
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    const {
      error,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

    if (error) {
      console.error(
        "VEND rollback Auth deletion failed:",
        error
      );
    }
  } catch (error) {
    console.error(
      "VEND rollback exception:",
      error
    );
  }
}

export async function POST(
  request: Request
) {
  let createdUserId: string | null = null;

  try {
    const body = await request.json();

    const fullName =
      String(body.fullName || "").trim();

    const phone =
      normalizePhone(
        String(body.phone || "")
      );

    const email =
      normalizeEmail(
        String(body.email || "")
      );

    const territory =
      String(
        body.territory || ""
      ).trim();

    const password =
      String(body.password || "");

    const confirmPassword =
      String(
        body.confirmPassword || ""
      );

    const rawPogpCode =
      String(
        body.pogpCode || ""
      );

    // ---------------------------------------------------------
    // Basic validation
    // ---------------------------------------------------------

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Phone / WhatsApp number is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (!territory) {
      return NextResponse.json(
        {
          error:
            "Territory or zone is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Password validation
    // ---------------------------------------------------------

    if (!password) {
      return NextResponse.json(
        {
          error:
            "Password is required.",
        },
        { status: 400 }
      );
    }

    if (
      password.length <
      MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        {
          error:
            "Please confirm your password.",
        },
        { status: 400 }
      );
    }

    if (
      password !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Normalize + validate optional recruiting POGP
    // ---------------------------------------------------------

    let recruitedByPogpId:
      string | null = null;

    const pogpCode =
      rawPogpCode.trim()
        ? normalizePogpCode(
            rawPogpCode
          )
        : "";

    if (pogpCode) {
      const {
        data: pogp,
        error: pogpError,
      } =
        await supabaseAdmin
          .from(
            "pogp_partners"
          )
          .select(
            "id, pogp_code, status"
          )
          .eq(
            "pogp_code",
            pogpCode
          )
          .eq(
            "status",
            "active"
          )
          .maybeSingle();

      if (pogpError) {
        console.error(
          "VEND POGP lookup error:",
          pogpError
        );

        return NextResponse.json(
          {
            error:
              "Unable to validate the POGP referral code.",
          },
          { status: 500 }
        );
      }

      if (!pogp) {
        return NextResponse.json(
          {
            error:
              "POGP code not found. Please check the code and try again.",
          },
          { status: 400 }
        );
      }

      recruitedByPogpId =
        pogp.id;
    } else if (
      rawPogpCode.trim() &&
      !pogpCode
    ) {
      return NextResponse.json(
        {
          error:
            "POGP code not found. Please check the code and try again.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Global email uniqueness
    // ---------------------------------------------------------

    try {
      if (
        await isEmailTakenGlobally(
          email
        )
      ) {
        return NextResponse.json(
          {
            error:
              GLOBAL_EMAIL_TAKEN_MESSAGE,
          },
          { status: 409 }
        );
      }
    } catch (
      emailLookupError
    ) {
      console.error(
        "VEND global email lookup error:",
        emailLookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing PoultryOps records.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Phone uniqueness is intentionally NOT enforced.
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // Generate next VEND number atomically
    // ---------------------------------------------------------

    const {
      data: sequenceData,
      error: sequenceError,
    } =
      await supabaseAdmin.rpc(
        "get_next_vend_number"
      );

    if (sequenceError) {
      console.error(
        "VEND sequence error:",
        sequenceError
      );

      return NextResponse.json(
        {
          error:
            "Unable to generate a VEND code. Please try again.",
        },
        { status: 500 }
      );
    }

    const nextNumber =
      Number(sequenceData);

    if (
      !Number.isInteger(
        nextNumber
      ) ||
      nextNumber < 1
    ) {
      console.error(
        "Invalid VEND sequence value:",
        sequenceData
      );

      return NextResponse.json(
        {
          error:
            "Unable to generate a valid VEND code.",
        },
        { status: 500 }
      );
    }

    const vendCode =
      `VEND-${String(
        nextNumber
      ).padStart(3, "0")}`;

    // ---------------------------------------------------------
    // Create Supabase Auth user (UNVERIFIED)
    // ---------------------------------------------------------

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: false,
          user_metadata: {
            full_name:
              fullName,
            account_type:
              "vend",
          },
        }
      );

    if (
      authError ||
      !authData.user
    ) {
      const message =
        String(
          authError?.message ||
            ""
        ).toLowerCase();

      if (
        message.includes(
          "already registered"
        ) ||
        message.includes(
          "already exists"
        ) ||
        message.includes(
          "duplicate"
        ) ||
        message.includes(
          "already been registered"
        )
      ) {
        return NextResponse.json(
          {
            error:
              GLOBAL_EMAIL_TAKEN_MESSAGE,
          },
          { status: 409 }
        );
      }

      console.error(
        "VEND Auth creation error:",
        authError
      );

      return NextResponse.json(
        {
          error:
            "Unable to create your VEND login account. Please try again.",
        },
        { status: 500 }
      );
    }

    createdUserId =
      authData.user.id;

    // ---------------------------------------------------------
    // Create/update profiles record
    //
    // IMPORTANT:
    // Use upsert rather than insert.
    //
    // A profile row may already exist for the newly-created
    // Auth user ID. In that situation a plain INSERT causes:
    //
    // duplicate key value violates unique constraint
    // "profiles_pkey"
    //
    // Upsert safely creates the row when absent and updates
    // it when already present.
    // ---------------------------------------------------------

    const {
      error: profileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: createdUserId,
            email,
            full_name:
              fullName,
            farm_id: null,
            role: "vend",
            status: "active",
            must_change_password:
              false,
          },
          {
            onConflict:
              "id",
          }
        );

    if (profileError) {
      console.error(
        "VEND profile creation/update error:",
        profileError
      );

      await rollbackAuthUser(
        createdUserId
      );

      createdUserId = null;

      return NextResponse.json(
        {
          error:
            "Unable to complete your VEND registration. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Create vend_partners record
    // ---------------------------------------------------------

    const {
      data: vend,
      error: insertError,
    } =
      await supabaseAdmin
        .from(
          "vend_partners"
        )
        .insert({
          profile_id:
            createdUserId,
          full_name:
            fullName,
          email,
          phone,
          territory,
          vend_code:
            vendCode,
          status: "active",
          recruited_by_pogp_id:
            recruitedByPogpId,
        })
        .select(
          "id, full_name, email, phone, territory, vend_code, status, recruited_by_pogp_id, joined_at"
        )
        .single();

    if (insertError) {
      console.error(
        "VEND creation error:",
        insertError
      );

      await rollbackAuthUser(
        createdUserId
      );

      createdUserId = null;

      return NextResponse.json(
        {
          error:
            "Unable to complete your VEND registration. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Send verification email
    //
    // Account remains UNVERIFIED until email verification.
    // Verification email failure does NOT roll back the account.
    // ---------------------------------------------------------

    let verificationEmailSent =
      false;

    try {
      const frontendUrl = (
        process.env.FRONTEND_URL ||
        "https://poultry.trueops.app"
      ).replace(
        /\/$/,
        ""
      );

      const {
        data: linkData,
        error: linkError,
      } =
        await supabaseAdmin.auth.admin.generateLink(
          {
            type: "signup",
            email,
            password,
            options: {
              redirectTo:
                `${frontendUrl}/auth/callback?next=/login?verified=1`,
            },
          }
        );

      const actionLink =
        linkData?.properties
          ?.action_link;

      if (
        linkError ||
        !actionLink
      ) {
        console.error(
          "VEND verification link error:",
          linkError
        );
      } else {
        await sendVendVerificationEmail(
          createdUserId,
          email,
          fullName,
          vendCode,
          actionLink
        );

        verificationEmailSent =
          true;
      }
    } catch (
      verificationError
    ) {
      console.error(
        "VEND verification email error:",
        verificationError
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          verificationEmailSent
            ? "VEND registration successful."
            : "VEND registration successful, but the verification email could not be sent. Please request a new verification email and try again.",

        verificationEmailSent,

        vend: {
          id: vend.id,
          fullName:
            vend.full_name,
          email:
            vend.email,
          phone:
            vend.phone,
          territory:
            vend.territory,
          vendCode:
            vend.vend_code,
          status:
            vend.status,
          recruitedByPogpId:
            vend.recruited_by_pogp_id,
          joinedAt:
            vend.joined_at,
        },

        referralUrl:
          `/register?ref=${encodeURIComponent(
            vend.vend_code
          )}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "VEND join API error:",
      error
    );

    if (createdUserId) {
      await rollbackAuthUser(
        createdUserId
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your registration.",
      },
      { status: 500 }
    );
  }
}