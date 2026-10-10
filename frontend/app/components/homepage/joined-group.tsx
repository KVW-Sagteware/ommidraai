"use client";

import { useTranslations } from "next-intl";
import { GroupCard, GroupItem } from "./group-card";

type JoinedGroupsProps = {
  groups: GroupItem[];
  onOpen?: (group: GroupItem) => void;
  onLeave?: (group: GroupItem) => void;
};

export function JoinedGroups({
  groups,
  onOpen,
  onLeave,
}: JoinedGroupsProps) {
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
          actionLabel={t("leave")}
          actionVariant="warning"
          groupItem={group}
          onAction={onLeave ? () => onLeave(group) : undefined}
          onOpen={onOpen ? () => onOpen(group) : undefined}
        />
      ))}
    </div>
  );
}