"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useUsers } from "@/hooks/useUsers";
import AppShell from "@/components/layout/app-shell";
import UsersList from "@/components/users/users-list";
import CreateUserForm from "@/components/users/create-user-form";
import OwnerOnly from "@/components/auth/owner-only";

export default function UsersPage() {
  const { user } = useAuth();

  const { data, loading } = useDashboard();

  const farmId = data?.farm?.id;

  const { users } = useUsers(farmId);

  if (loading) {
    return <div>Loading...</div>;
  }

return (
  <OwnerOnly>
    <AppShell
      email={user?.email}
      farmName={data?.farm?.name}
    >
      <div className="p-6 space-y-6">
        <h1 className="text-4xl font-bold">
          User Management
        </h1>

        <UsersList
  users={users}
  plan={data?.subscription?.plan}
/>

        <CreateUserForm farmId={farmId} />
      </div>
    </AppShell>
  </OwnerOnly>
);
}