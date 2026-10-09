"use client";

import { useTranslations } from "next-intl";
import { GroupCard } from "./group-card";
import type { GroupItem } from "@/app/lib/types";

type MyGroupsProps = {
  groups: GroupItem[];
  onOpen?: (group: GroupItem) => void;
  onDelete?: (group: GroupItem) => void;
};

export function MyGroups({
  groups,
  onOpen,
  onDelete,
}: MyGroupsProps) {
  const t = useTranslations("home");

  if (groups.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-xl bg-gray-50 text-gray-400 text-sm">
        {t("noGroupsInSection")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.User_Group.group_id}
          actionLabel={t("delete")}
          actionVariant="danger"
          groupItem={group}
          addRoleSection={false}
          onAction={onDelete ? () => onDelete(group) : undefined}
          onOpen={onOpen ? () => onOpen(group) : undefined}
        />
      ))}
    </div>
  );
}