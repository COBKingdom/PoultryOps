"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function RegisterForm() {
  const [farmName, setFarmName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setMessage("")

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
        })
console.log("USER:", data.user)
console.log("SESSION:", data.session)

const {
  data: { session }
} = await supabase.auth.getSession()

console.log("CURRENT SESSION:", session)
      if (error) throw error

      if (!data.user) {
        throw new Error("User not created")
      }

      const userId = data.user.id

      // Create Farm

      const { data: farm, error: farmError } =
        await supabase
          .from("farms")
          .insert({
            name: farmName,
            owner_id: userId,
            farm_type: "Poultry",
            active: true,
          })
          .select()
          .single()

      if (farmError) throw farmError

      // Update Profile

      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            farm_id: farm.id,
            role: "owner",
          })
          .eq("id", userId)

      if (profileError) throw profileError

      // Farm User

      const { error: farmUserError } =
        await supabase
          .from("farm_users")
          .insert({
            farm_id: farm.id,
            user_id: userId,
            role: "owner",
          })

      if (farmUserError) throw farmUserError

      // Subscription

      const trialStart = new Date()

      const trialEnd = new Date()

      trialEnd.setDate(
        trialEnd.getDate() + 30
      )

      const { error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .insert({
            farm_id: farm.id,
            plan: "starter",
            status: "trial",
            trial_start: trialStart,
            trial_end: trialEnd,
          })

      if (subscriptionError)
        throw subscriptionError

      setMessage(
        "Account created. Please verify your email."
      )

    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="space-y-4"
    >
      <input
        placeholder="Farm Name"
        value={farmName}
        onChange={(e) =>
          setFarmName(e.target.value)
        }
        className="w-full border p-3 rounded"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="w-full border p-3 rounded"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="w-full border p-3 rounded"
      />

      <button
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded"
      >
        {loading
          ? "Creating..."
          : "Start Free Trial"}
      </button>

      {message && (
        <p className="text-sm">
          {message}
        </p>
      )}
    </form>
  )
}