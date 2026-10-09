"use client";

import { useTranslations } from "next-intl";

export interface Invite {
  user_id: number;
  origin_id: number;
  group_id: number;
  role: string;
  group_name: string;
  origin_username: string;
}

interface NotificationsProps {
  invites: Invite[];
  loading: boolean;
  error: string | null;
  onAcceptInvite: (invite: Invite) => Promise<void>;
  onDeclineInvite: (invite: Invite) => Promise<void>;
}

export function Notifications({
  invites,
  loading,
  error,
  onAcceptInvite,
  onDeclineInvite,
}: NotificationsProps) {
  const t = useTranslations("profile");

  return (
    <section className="mt-8">

      <h2 className="mb-6 text-3xl font-bold text-[#3d3461]">
        {t("sentInvites")}
      </h2>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">{t("notificationsLoading")}</p>
      ) : invites.length === 0 ? (
        <div
          className="
            rounded-2xl
            bg-[#eef5f1]
            border-2
            border-[#b6cfc6]
            p-6
          "
        >
          <p className="text-gray-500">{t("noNotifications")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {invites.map((invite) => (
            <li
              key={invite.group_id}
              className="
                flex
                flex-col
                gap-4
                rounded-2xl
                bg-[#eef5f1]
                border-2
                border-[#b6cfc6]
                p-6
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p className="text-lg font-semibold text-[#3d3461]">
                  {t("inviteNotificationTitle", {
                    groupName: invite.group_name || t("unknownGroup"),
                  })}
                </p>
                {invite.origin_username && (
                  <p className="mt-1 text-sm text-gray-500">
                    {t("inviteNotificationSubtitle", {
                      username: invite.origin_username,
                    })}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onAcceptInvite(invite)}
                  className="rounded-xl bg-[#a8be8f] px-5 py-2.5 font-semibold text-[#3d3461] transition hover:bg-[#93ad7c]"
                >
                  {t("acceptInvite")}
                </button>
                <button
                  type="button"
                  onClick={() => onDeclineInvite(invite)}
                  className="rounded-xl bg-gray-200 px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  {t("declineInvite")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </section>
  );
}