
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Cookies from "js-cookie";

export function ProfileMenu() {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState(0);

    const [error, setError] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const t = useTranslations("navigation");
    const tCommon = useTranslations("common");

    // Fetch username and handle outside clicks
    useEffect(() => {
        const user = Cookies.get("username");

        if (user) {
            setUsername(user);
        }

        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // Fetch notification count
    useEffect(() => {
        async function fetchNotifications() {
            try {
                const response = await fetch(
                    "/api/backend/invite"
                );

                if (!response.ok) return;

                const data = await response.json();

                setNotificationCount(
                    Array.isArray(data) ? data.length : 0
                );
            } catch (err) {
                console.error(
                    "Failed to fetch notifications:",
                    err
                );
            }
        }

        fetchNotifications();
    }, []);

    // Logout
    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);
        setError(null);
        try {
            const response = await fetch(
                "/api/backend/auth/logout",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    tCommon("somethingWentWrong")
                );
            }

            router.refresh();
            router.push("/login");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : tCommon("somethingWentWrong")
            );
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div ref={menuRef} className="relative">
            {/* Hamburger Menu Button */}
            <button type="button" onClick={() => setOpen(!open)} aria-label="Open profile menu"
                    aria-expanded={open} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#3d3461] text-3xl
                    font-bold text-[#a8be8f] transitionhover: bg-[#3d3461]">
                ☰

                {/* Notification Badge */}
                {notificationCount > 0 && (
                    <span
                        className="absolute-right-1-top-2 flex h-5 min-w-5 items-center justify-center
                            rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow-md">
                        {notificationCount > 99? "99+": notificationCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div
                    className=" absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-[#b6cfc6] bg-white shadow-xl">
                    {/* Username */}
                    <div className=" block bg-gray-100 px-5 py-3 text-gray-500">
                        {username ? t("loggedInAs") + username: t("usernameError")}
                    </div>

                    <hr />

                    {/* Profile */}
                    <Link
                        href="/user/profile"
                        className=" block px-5 py-3 text-gray-500 hover:bg-[#eef5f1]" 
                        onClick={() => setOpen(false)}>
                        {t("profile")}

                        {notificationCount > 0 && (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                                {notificationCount > 99? "99+": notificationCount}
                            </span>
                        )}
                    </Link>

                    <hr />

                    {/* Logout */}
                    <Link
                        href="/login"
                        className=" block px-5 py-3 text-red-600 hover:bg-red-50"
                         onClick={async (event) => {
                            event.preventDefault();
                            setOpen(false);
                            await handleLogout();
                        }}>
                    {error && (
                        <p className="px-5 py-3 text-sm font-semibold text-red-600" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        disabled={loggingOut}
                        className="
                            w-full
                            block
                            px-5
                            py-3
                            text-left
                            hover:bg-red-50
                            text-red-600
                            disabled:opacity-60
                        "
                        onClick={() => void handleLogout()}
                    >
                        {t("logout")}
                    </button>
                </div>
            )}
            
        </div>
    );
}