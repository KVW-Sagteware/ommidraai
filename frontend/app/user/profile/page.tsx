"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProfileHeader } from "@/app/components/profile/profile-header";
import { ProfileInfo } from "@/app/components/profile/profile-info";
import { SavedLocations } from "@/app/components/profile/saved-locations";
import { Notifications } from "@/app/components/profile/notifications";

type ApiMeResponse = {
    id: number;
    username: string;
    email: string;
    default_location_id: number;
};

type Tab = "overview" | "notifications";

export default function ProfilePage() {
    const [user, setUser] = useState<ApiMeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const t = useTranslations("profile");

    useEffect(() => {
        async function fetchUser() {
            setLoading(true);
            try {
                const response = await fetch(`/api/backend/auth/me`);
                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }
                const data = await response.json() as ApiMeResponse;
                setUser(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    async function handleUpdateUsername(newUsername: string) {
        setUpdateError(null);
        try {
            const response = await fetch(`/api/backend/auth/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: newUsername }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to update username");
            }

            setUser((prev) => prev ? { ...prev, username: newUsername } : prev);
        } catch (err) {
            setUpdateError(
                err instanceof Error ? err.message : "An unexpected error occurred"
            );
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#b6cfc6] to-white">
            <div className="mx-auto max-w-5xl">

                <ProfileHeader />

                <div className="bg-white p-8">

                    <div className="flex gap-2 border-b-2 border-[#b6cfc6] pb-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab("overview")}
                            aria-pressed={activeTab === "overview"}
                            className={
                                activeTab === "overview"
                                    ? "rounded-full bg-[#a8be8f] px-5 py-2 font-semibold text-[#3d3461]"
                                    : "rounded-full px-5 py-2 font-medium text-gray-600 transition hover:bg-[#eef5f1]"
                            }
                        >
                            {t("overviewTab")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("notifications")}
                            aria-pressed={activeTab === "notifications"}
                            className={
                                activeTab === "notifications"
                                    ? "rounded-full bg-[#a8be8f] px-5 py-2 font-semibold text-[#3d3461]"
                                    : "rounded-full px-5 py-2 font-medium text-gray-600 transition hover:bg-[#eef5f1]"
                            }
                        >
                            {t("notificationsTab")}
                        </button>
                    </div>

                    {activeTab === "overview" ? (
                        <>
                            {loading ? (
                                <p className="text-gray-500">Loading profile…</p>
                            ) : user ? (
                                <ProfileInfo
                                    username={user.username}
                                    email={user.email}
                                    onUpdateUsername={handleUpdateUsername}
                                />
                            ) : (
                                <p className="text-red-600">Could not load profile.</p>
                            )}

                            {updateError && (
                                <p className="mt-2 text-sm text-red-600">{updateError}</p>
                            )}

                            <SavedLocations />
                        </>
                    ) : (
                        <Notifications />
                    )}

                </div>

            </div>
        </main>
    );
}
