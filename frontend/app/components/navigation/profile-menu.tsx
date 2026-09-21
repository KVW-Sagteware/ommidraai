"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useTranslations } from "next-intl";
import Cookies from 'js-cookie';

export function ProfileMenu() {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations("navigation");
    const tCommon = useTranslations("common");

    useEffect(() => {
        const user = Cookies.get('username');
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

    const handleLogout = async () => {
        try {
            const response = await fetch(`/api/backend/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || tCommon("somethingWentWrong"));
            }

            router.refresh();

            router.push('/login');
        } catch (err) {
            alert(err);
        }
    };

    return (
        <div
            ref={menuRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label="Open profile menu"
                aria-expanded={open}
                className=" flex h-12 w-12 items-center justify-center bg-[#3d3461] 
                text-2xl font-bold text-[#a8be8f] ">
                    ☰
            </button>

            {open && (
                <div
                    className="
                        absolute
                        right-0
                        mt-3
                        w-56
                        rounded-2xl
                        bg-white
                        shadow-xl
                        border
                        border-[#b6cfc6]
                        overflow-hidden
                    "
                >
                    <div
                        className="
                            block
                            px-5
                            py-3
                            text-gray-500
                            bg-gray-100
                        "
                    >
                      {username ? t("loggedInAs") + username : t("usernameError")}
                    </div>

                    <hr />

                    <Link
                        href="/user/profile"
                        className="
                            block
                            px-5
                            py-3
                            hover:bg-[#eef5f1]
                            text-gray-500
                        "
                    >
                        {t("profile")}
                    </Link>

                    {/*<Link
                        href="/groups"
                        className="
                            block
                            px-5
                            py-3
                            hover:bg-[#eef5f1]
                        "
                    >
                         Groups
                    </Link>*/}

                    <hr />

                    <Link
                        href="/login"
                        className="
                            block
                            px-5
                            py-3
                            hover:bg-red-50
                            text-red-600
                        "
                        onClick={handleLogout}
                    >
                        {t("logout")}
                    </Link>
                </div>
            )}
        </div>
    );
}