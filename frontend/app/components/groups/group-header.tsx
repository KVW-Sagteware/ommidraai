"use client";

import { useTranslations } from "next-intl";
import type { Role } from "./types";

interface GroupHeaderProps {
  groupName: string;
  currentUserRole: Role;
}

export function GroupHeader({ groupName, currentUserRole }: GroupHeaderProps) {
  const t = useTranslations("group");

  return (
    <header className="mb-8 border-b border-gray-200 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {groupName}
          </h1>

          <p className="mt-2 text-gray-500">
            {t("welcome", { groupName })}
          </p>

          <div className="mt-3">
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              {t("yourRole", { role: currentUserRole })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
