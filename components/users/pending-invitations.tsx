"use client";

import {
  cancelInvitation,
} from "@/lib/core/users";

type Props = {
  invitations: any[];
  refresh: () => Promise<void>;
};

export default function PendingInvitations({
  invitations,
  refresh,
}: Props) {
  async function handleCancel(
    invitationId: string
  ) {
    const confirmed =
      window.confirm(
        "Cancel this invitation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await cancelInvitation(
        invitationId
      );

      await refresh();

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        Pending Invitations
      </h2>

      {invitations.length === 0 ? (
        <div className="text-slate-500">
          No pending invitations.
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map(
            (invitation) => (
              <div
                key={invitation.id}
                className="
                  border
                  border-slate-200
                  rounded-2xl
                  p-4
                  flex
                  justify-between
                  items-center
                "
              >
                <div>
                  <p className="font-semibold">
                    {invitation.email}
                  </p>

                  <p className="text-sm text-slate-500">
                    Role:{" "}
                    {invitation.role}
                  </p>

                  <p className="text-sm text-slate-500">
                    Status:{" "}
                    {invitation.status}
                  </p>

                  <p className="text-sm text-slate-500">
                    Invited:{" "}
                    {new Date(
                      invitation.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCancel(
                      invitation.id
                    )
                  }
                  className="
                    px-4
                    py-2
                    rounded-xl
                    bg-red-100
                    text-red-700
                    font-semibold
                  "
                >
                  Cancel
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}