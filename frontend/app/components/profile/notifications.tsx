"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Invite = {
    user_id: number;
    origin_id: number;
    group_id: number;
    role: string;
    group_name: string;
    origin_username: string;
};

export function Notifications() {
    const t = useTranslations("profile");
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const response = await fetch(`/api/backend/invite`);
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || t("notificationsLoadFailed"));
                }
                const data = await response.json() as Invite[];
                setInvites(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : t("notificationsLoadFailed"));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [t]);

    async function acceptInvite(invite: Invite) {
        try {
            const response = await fetch(
                `/api/backend/invite/accept?group_id=${invite.group_id}`,
                { method: "POST" }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || t("notificationsAcceptFailed"));
            }
            setInvites((prev) => prev.filter((i) => i.group_id !== invite.group_id));
        } catch (err) {
            setError(err instanceof Error ? err.message : t("notificationsAcceptFailed"));
        }
    }

    async function declineInvite(invite: Invite) {
        try {
            const response = await fetch(
                `/api/backend/invite/decline?group_id=${invite.group_id}`,
                { method: "POST" }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || t("notificationsDeclineFailed"));
            }
            setInvites((prev) => prev.filter((i) => i.group_id !== invite.group_id));
        } catch (err) {
            setError(err instanceof Error ? err.message : t("notificationsDeclineFailed"));
        }
    }

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
                                    onClick={() => acceptInvite(invite)}
                                    className="rounded-xl bg-[#a8be8f] px-5 py-2.5 font-semibold text-[#3d3461] transition hover:bg-[#93ad7c]"
                                >
                                    {t("acceptInvite")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => declineInvite(invite)}
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
