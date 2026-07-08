"use client";

import { useState } from "react";

interface CreateUserFormProps {
  farmId: string;
}

export default function CreateUserForm({
  farmId,
}: CreateUserFormProps) {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response =
        await fetch(
          "/api/users/create",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              fullName,
              email,
              password,
              role: "data_entry",
              farmId,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Failed to create team member"
        );
        return;
      }

      setSuccess(
        "✓ Team member created successfully"
      );

      setFullName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">
        Add Team Member
      </h2>

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) =>
            setFullName(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
          required
        />

        <input
          type="password"
          placeholder="Temporary Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
          required
        />

        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-sm text-slate-600">
            Role
          </p>

          <p className="font-medium">
            Data Entry
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl p-3 font-medium disabled:opacity-50"
        >
          {loading
            ? "Creating Team Member..."
            : "Add Team Member"}
        </button>
      </form>
    </div>
  );
}