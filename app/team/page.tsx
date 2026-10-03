"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

import AppShell from "@/components/layout/app-shell";

import {
  Users,
  Plus,
  RefreshCw,
} from "lucide-react";

import TeamCard from "@/components/team/team-card";
import InviteMemberDialog from "@/components/team/invite-member-dialog";
import MemberWorkspace from "@/components/team/member-workspace";

export default function TeamPage() {
  const { user } = useAuth();

  const {
    can,
    loading: permissionsLoading,
  } = usePermissions();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const [isInviteDialogOpen, setIsInviteDialogOpen] =
    useState(false);

  const [selectedMemberId, setSelectedMemberId] =
    useState<string | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const farmId = farm?.id;

  const canViewTeam =
    can(PERMISSIONS.TEAM_VIEW);

  const canInvite =
    can(PERMISSIONS.TEAM_INVITE);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleMemberSelect = (
    memberId: string
  ) => {
    setSelectedMemberId(memberId);
  };

  const handleCloseWorkspace = () => {
    setSelectedMemberId(null);
    handleRefresh();
  };

  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */
  if (
    permissionsLoading ||
    farmLoading
  ) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">

          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />

              <div className="h-5 w-64 bg-slate-200 rounded animate-pulse" />
            </div>

            <div className="flex gap-2">
              <div className="h-12 w-28 bg-slate-200 rounded-xl animate-pulse" />

              <div className="h-12 w-40 bg-slate-200 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Team Content Skeleton */}
          <div
            className="
              relative overflow-hidden
              rounded-xl
              border border-blue-100
              bg-white
              p-6
              shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_22px_rgba(15,23,42,0.07)]
            "
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-500/85" />

            <div className="space-y-5 pt-1">

              <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(
                  (i) => (
                    <div
                      key={i}
                      className="h-24 bg-slate-100 rounded-xl animate-pulse"
                    />
                  )
                )}
              </div>

              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />

            </div>
          </div>

        </div>
      </AppShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * ACCESS CONTROL
   * ---------------------------------------------------------
   */
  if (!canViewTeam) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">

          <div className="text-center max-w-md">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Users
                className="text-red-600"
                size={32}
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Access Denied
            </h2>

            <p className="text-slate-500">
              You don't have permission to view the team management page.
            </p>

          </div>
        </div>
      </AppShell>
    );
  }

  /*
   * ---------------------------------------------------------
   * TEAM PAGE
   * ---------------------------------------------------------
   */
  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Team
            </h1>

            <p className="text-slate-500 mt-1">
              Manage team members and their permissions.
            </p>
          </div>

          <div className="flex gap-2">

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border border-blue-100
                bg-white
                px-4 py-3
                text-slate-700
                font-semibold
                shadow-[3px_4px_0_rgba(37,99,235,0.06),0_5px_16px_rgba(15,23,42,0.05)]
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:bg-slate-50
                hover:shadow-[4px_5px_0_rgba(37,99,235,0.09),0_8px_20px_rgba(15,23,42,0.07)]
                transition-all
                duration-200
              "
            >
              <RefreshCw size={20} />
              Refresh
            </button>

            {/* Invite Member */}
            {canInvite && (
              <button
                onClick={() =>
                  setIsInviteDialogOpen(true)
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-6 py-3
                  text-white
                  font-semibold
                  shadow-[3px_4px_0_rgba(30,64,175,0.18),0_6px_18px_rgba(15,23,42,0.08)]
                  hover:bg-blue-700
                  hover:-translate-y-0.5
                  hover:shadow-[4px_6px_0_rgba(30,64,175,0.22),0_9px_22px_rgba(15,23,42,0.10)]
                  transition-all
                  duration-200
                "
              >
                <Plus size={20} />
                Invite Member
              </button>
            )}

          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Team List */}
          <div
            className={
              selectedMemberId
                ? "lg:col-span-1"
                : "lg:col-span-3"
            }
          >
            <TeamCard
              key={refreshKey}
              farmId={farmId!}
              onMemberSelect={
                handleMemberSelect
              }
              selectedMemberId={
                selectedMemberId
              }
            />
          </div>

          {/* Member Workspace */}
          {selectedMemberId && (
            <div className="lg:col-span-2">
              <MemberWorkspace
                memberId={
                  selectedMemberId
                }
                onClose={
                  handleCloseWorkspace
                }
              />
            </div>
          )}

        </div>

        {/* Invite Member Dialog */}
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onClose={() =>
            setIsInviteDialogOpen(false)
          }
          farmId={farmId!}
          onSuccess={() => {
            setIsInviteDialogOpen(false);
            handleRefresh();
          }}
        />

      </div>
    </AppShell>
  );
}