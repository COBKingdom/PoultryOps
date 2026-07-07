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

  const [role, setRole] =
    useState("staff");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

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
              role,
              farmId,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result.error ||
            "Failed to create user"
        );
        return;
      }

      alert(
        "User created successfully"
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("staff");

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">
        Create User
      </h2>

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
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
          required
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-3"
        >
          <option value="manager">
            Manager
          </option>

          <option value="staff">
            Staff
          </option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl p-3 font-medium"
        >
          {loading
            ? "Creating..."
            : "Create User"}
        </button>
      </form>
    </div>
  );
}