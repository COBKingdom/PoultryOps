"use client";

import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";
import { usePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

import AppShell from "@/components/layout/app-shell";

import { Users, Plus, RefreshCw, UserCheck, UserX, Shield } from "lucide-react";

import TeamCard from "@/components/team/team-card";
import InviteMemberDialog from "@/components/team/invite-member-dialog";
import MemberWorkspace from "@/components/team/member-workspace";

export default function TeamPage() {
  const { user } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const { farm, loading: farmLoading } = useCurrentFarm();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const farmId = farm?.id;
  const canViewTeam = can(PERMISSIONS.TEAM_VIEW);
  const canInvite = can(PERMISSIONS.TEAM_INVITE);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleCloseWorkspace = () => {
    setSelectedMemberId(null);
    handleRefresh();
  };

  if (permissionsLoading || farmLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-5 w-64 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-48 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!canViewTeam) {
    return (
      <AppShell email={user?.email}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Users className="text-red-600" size={32} />
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

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Team
            </h1>
            <p className="text-slate-500 mt-1">
              Manage team members and their permissions.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 transition-all"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
            {canInvite && (
              <button
                onClick={() => setIsInviteDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus size={20} />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team List (Left Side) */}
          <div className={selectedMemberId ? "lg:col-span-1" : "lg:col-span-3"}>
            <TeamCard
              key={refreshKey}
              farmId={farmId!}
              onMemberSelect={handleMemberSelect}
              selectedMemberId={selectedMemberId}
            />
          </div>

          {/* Member Workspace (Right Side) */}
          {selectedMemberId && (
            <div className="lg:col-span-2">
              <MemberWorkspace
                memberId={selectedMemberId}
                onClose={handleCloseWorkspace}
              />
            </div>
          )}
        </div>

        {/* Invite Member Dialog */}
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
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