"use client";

import { useState } from "react";

import {
  inviteUser,
} from "@/lib/core/users";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  invitedBy: string;
};

export default function InviteUserForm({
  farmId,
  invitedBy,
}: Props) {
  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState("staff");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSave() {
    try {
      setErrorMessage("");
      setLoading(true);

      if (!email.trim()) {
        throw new Error(
          "Please enter an email address."
        );
      }

      await inviteUser(
        farmId,
        email.trim().toLowerCase(),
        role,
        invitedBy
      );

      setEmail("");
      setRole("staff");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error(
        "Invite User Error:",
        error
      );

      console.error(
        "Message:",
        error?.message
      );

      console.error(
        "Details:",
        error?.details
      );

      console.error(
        "Hint:",
        error?.hint
      );

      setErrorMessage(
        error?.message ||
        "Failed to create invitation."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Invite User
      </h2>

      <div className="space-y-4">

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option value="manager">
            Manager
          </option>

          <option value="staff">
            Staff
          </option>
        </select>

        {errorMessage && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              text-red-700
            "
          >
            {errorMessage}
          </div>
        )}

        <div
          onClick={handleSave}
          className="inline-block w-full"
        >
          <SaveButton
            loading={loading}
            success={success}
            label="Send Invite"
          />
        </div>

      </div>

    </div>
  );
}