import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CreatePogpUserParams {
  fullName: string;
  email: string;
  phone: string;
  territory?: string;
  notes?: string;
  pogpCode: string;
}

export interface CreatePogpUserResult {
  success: boolean;
  userId?: string;
  partnerId?: string;
  temporaryPassword?: string;
  error?: string;
}

/**
 * Creates a complete PoultryOps Growth Partner account.
 *
 * Architecture:
 *
 * Supabase Auth user
 *        ↓
 * profiles
 *        ↓
 * pogp_partners.profile_id
 *
 * POGPs are independent business/referral partners.
 * They are NOT farm users and therefore do not receive
 * farm_users records or farm_id values.
 *
 * The POGP receives a temporary password and must change
 * it on first login.
 */
export async function createPogpUser(
  params: CreatePogpUserParams
): Promise<CreatePogpUserResult> {
  const fullName =
    params.fullName.trim();

  const email =
    params.email.trim().toLowerCase();

  const phone =
    params.phone.trim();

  const territory =
    params.territory?.trim() || null;

  const notes =
    params.notes?.trim() || null;

  const pogpCode =
    params.pogpCode.trim().toUpperCase();

  if (!fullName) {
    return {
      success: false,
      error: "Full name is required",
    };
  }

  if (!email) {
    return {
      success: false,
      error: "Email address is required",
    };
  }

  if (!phone) {
    return {
      success: false,
      error: "Phone number is required",
    };
  }

  if (!pogpCode) {
    return {
      success: false,
      error: "POGP code is required",
    };
  }

  const temporaryPassword =
    generateTemporaryPassword();

  /*
   * This is only assigned after Auth creation succeeds.
   * It is used solely for rollback.
   */
  let createdUserId: string | undefined;

  try {
    // ==========================================================
    // 1. Create Supabase Auth user
    // ==========================================================

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          pogp_code: pogpCode,
          account_type: "pogp",
        },
      });

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        "[POGP onboarding] Auth user creation failed:",
        authError
      );

      return {
        success: false,
        error:
          authError?.message ||
          "Unable to create POGP login account",
      };
    }

    createdUserId =
      authData.user.id;

    // ==========================================================
    // 2. Create POGP profile
    // ==========================================================

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: createdUserId,
        email,
        full_name: fullName,
        farm_id: null,
        role: "pogp",
        status: "active",
        must_change_password: true,
      });

    if (profileError) {
      console.error(
        "[POGP onboarding] Profile creation failed:",
        profileError
      );

      await cleanupAuthUser(
        createdUserId
      );

      return {
        success: false,
        error:
          "Unable to create POGP profile",
      };
    }

    // ==========================================================
    // 3. Create POGP partner record
    // ==========================================================

    const {
      data: partner,
      error: partnerError,
    } = await supabaseAdmin
      .from("pogp_partners")
      .insert({
        profile_id: createdUserId,
        full_name: fullName,
        phone,
        email,
        pogp_code: pogpCode,
        territory,
        notes,
        status: "active",
      })
      .select(`
        id,
        profile_id,
        full_name,
        phone,
        email,
        pogp_code,
        status,
        territory,
        joined_at,
        notes,
        created_at
      `)
      .single();

    if (
      partnerError ||
      !partner
    ) {
      console.error(
        "[POGP onboarding] Partner creation failed:",
        partnerError
      );

      await cleanupAuthUser(
        createdUserId
      );

      return {
        success: false,
        error:
          partnerError?.code === "23505"
            ? "A POGP partner with this email or referral code already exists"
            : "Unable to create POGP partner record",
      };
    }

    // ==========================================================
    // 4. Send invitation email
    // ==========================================================

    try {
      const {
        sendInvitationEmail,
      } = await import(
        "@/lib/email-service"
      );

      await sendInvitationEmail(
        email,
        "PoultryOps Growth Partner Portal",
        temporaryPassword,
        "pogp"
      );
    } catch (emailError) {
      console.error(
        "[POGP onboarding] Invitation email failed:",
        emailError
      );

      // Remove the partner record created above.
      await supabaseAdmin
        .from("pogp_partners")
        .delete()
        .eq(
          "id",
          partner.id
        );

      await cleanupAuthUser(
        createdUserId
      );

      return {
        success: false,
        error:
          `POGP account created but invitation email failed: ${
            emailError instanceof Error
              ? emailError.message
              : String(emailError)
          }`,
      };
    }

    // ==========================================================
    // 5. Successful completion
    // ==========================================================

    console.log(
      `[POGP onboarding] Created ${pogpCode} for ${email}`
    );

    return {
      success: true,
      userId: createdUserId,
      partnerId: partner.id,
      temporaryPassword,
    };
  } catch (error) {
    console.error(
      "[POGP onboarding] Unexpected error:",
      error
    );

    if (createdUserId) {
      await cleanupAuthUser(
        createdUserId
      );
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create POGP account",
    };
  }
}

/**
 * Deletes the Auth user during rollback.
 *
 * The profile is linked to the Auth user and should
 * therefore be cleaned up by the database relationship.
 */
async function cleanupAuthUser(
  userId: string
): Promise<void> {
  try {
    const {
      error,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

    if (error) {
      console.error(
        "[POGP onboarding] Auth cleanup failed:",
        error
      );
    }
  } catch (error) {
    console.error(
      "[POGP onboarding] Auth cleanup exception:",
      error
    );
  }
}

/**
 * Generates an 8-character temporary password.
 *
 * Guarantees:
 * - uppercase
 * - lowercase
 * - number
 * - special character
 */
function generateTemporaryPassword(): string {
  const uppercase =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const lowercase =
    "abcdefghijklmnopqrstuvwxyz";

  const numbers =
    "0123456789";

  const special =
    "!@#$%";

  const password: string[] = [
    uppercase[
      Math.floor(
        Math.random() *
          uppercase.length
      )
    ],
    lowercase[
      Math.floor(
        Math.random() *
          lowercase.length
      )
    ],
    numbers[
      Math.floor(
        Math.random() *
          numbers.length
      )
    ],
    special[
      Math.floor(
        Math.random() *
          special.length
      )
    ],
  ];

  const allCharacters =
    uppercase +
    lowercase +
    numbers +
    special;

  for (let i = 0; i < 4; i++) {
    password.push(
      allCharacters[
        Math.floor(
          Math.random() *
            allCharacters.length
        )
      ]
    );
  }

  return password
    .sort(
      () => Math.random() - 0.5
    )
    .join("");
}