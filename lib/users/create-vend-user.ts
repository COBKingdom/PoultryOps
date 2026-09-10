import { supabaseAdmin } from "@/lib/supabase-admin";

export interface CreateVendUserParams {
  fullName: string;
  email: string;
  phone: string;
  territory?: string;
  vendCode: string;
  recruitedByPogpId?: string | null;
}

export interface CreateVendUserResult {
  success: boolean;
  userId?: string;
  partnerId?: string;
  temporaryPassword?: string;
  error?: string;
}

/**
 * Creates a complete PoultryOps VEND partner account.
 *
 * Architecture:
 *
 * Supabase Auth user
 *        ↓
 * profiles
 *        ↓
 * vend_partners.profile_id
 *
 * VENDs are independent business/referral partners.
 * They are NOT farm users and therefore do not receive
 * farm_users records or farm_id values.
 *
 * The VEND receives a temporary password and must change
 * it on first login.
 */
export async function createVendUser(
  params: CreateVendUserParams
): Promise<CreateVendUserResult> {
  const fullName = params.fullName.trim();
  const email = params.email.trim().toLowerCase();
  const phone = params.phone.trim();
  const territory = params.territory?.trim() || null;
  const vendCode = params.vendCode.trim().toUpperCase();
  const recruitedByPogpId =
    params.recruitedByPogpId?.trim() || null;

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

  if (!vendCode) {
    return {
      success: false,
      error: "VEND code is required",
    };
  }

  const temporaryPassword =
    generateTemporaryPassword();

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
          vend_code: vendCode,
          account_type: "vend",
        },
      });

    if (!authData.user || authError) {
      console.error(
        "[VEND onboarding] Auth user creation failed:",
        authError
      );

      return {
        success: false,
        error:
          authError?.message ||
          "Unable to create VEND login account",
      };
    }

    createdUserId = authData.user.id;

    // ==========================================================
    // 2. Create VEND profile
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
        role: "vend",
        status: "active",
        must_change_password: true,
      });

    if (profileError) {
      console.error(
        "[VEND onboarding] Profile creation failed:",
        profileError
      );

      await cleanupAuthUser(createdUserId);

      return {
        success: false,
        error: "Unable to create VEND profile",
      };
    }

    // ==========================================================
    // 3. Create VEND partner record
    // ==========================================================

    const {
      data: partner,
      error: partnerError,
    } = await supabaseAdmin
      .from("vend_partners")
      .insert({
        profile_id: createdUserId,
        full_name: fullName,
        email,
        phone,
        vend_code: vendCode,
        status: "active",
        territory,
        recruited_by_pogp_id: recruitedByPogpId,
      })
      .select(`
        id,
        profile_id,
        full_name,
        email,
        phone,
        vend_code,
        status,
        territory,
        recruited_by_pogp_id,
        joined_at,
        created_at
      `)
      .single();

    if (!partner || partnerError) {
      console.error(
        "[VEND onboarding] Partner creation failed:",
        partnerError
      );

      await cleanupAuthUser(createdUserId);

      return {
        success: false,
        error:
          partnerError?.code === "23505"
            ? "A VEND partner with this email or referral code already exists"
            : "Unable to create VEND partner record",
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
        "PoultryOps VEND Partner Portal",
        temporaryPassword,
        "vend"
      );
    } catch (emailError) {
      console.error(
        "[VEND onboarding] Invitation email failed:",
        emailError
      );

      await supabaseAdmin
        .from("vend_partners")
        .delete()
        .eq("id", partner.id);

      await cleanupAuthUser(createdUserId);

      return {
        success: false,
        error:
          `VEND account created but invitation email failed: ${
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
      `[VEND onboarding] Created ${vendCode} for ${email}`
    );

    return {
      success: true,
      userId: createdUserId,
      partnerId: partner.id,
      temporaryPassword,
    };
  } catch (error) {
    console.error(
      "[VEND onboarding] Unexpected error:",
      error
    );

    if (createdUserId) {
      await cleanupAuthUser(createdUserId);
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create VEND account",
    };
  }
}

/**
 * Deletes the Auth user during rollback.
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
        "[VEND onboarding] Auth cleanup failed:",
        error
      );
    }
  } catch (error) {
    console.error(
      "[VEND onboarding] Auth cleanup exception:",
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
