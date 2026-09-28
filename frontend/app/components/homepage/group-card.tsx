"use client";

import { useTranslations } from "next-intl";

interface UserGroupDetails {
  user_id: number;
  group_id: number;
  role: string;
  car_capacity: number;
  is_passenger: boolean;
}

interface GroupDetails {
  name: string;
}

export interface GroupItem {
  User_Group: UserGroupDetails;
  Group: GroupDetails;
}

type GroupCardProps = {
  name?: string;
  addRoleSection?: boolean;
  groupItem?: GroupItem;
  actionLabel: string;
  actionVariant?: "danger" | "warning";
  onAction?: () => void;
  onOpen?: () => void;
};

export function GroupCard({
  name,
  addRoleSection = true,
  groupItem,
  actionLabel,
  actionVariant = "danger",
  onAction,
  onOpen,
}: GroupCardProps) {
  const t = useTranslations("common");

  // Get the group name from groupItem if it exists.
  // Otherwise use the name prop.
  const groupName = name ?? groupItem?.Group?.name ?? t("unnamedGroup");
  const userRole = groupItem?.User_Group?.role ?? t("unknownRole");


  const buttonClasses =
    actionVariant === "warning"
      ? "bg-[#a8be8f] hover:bg-[#b6cfc6]"
      : "bg-[#a8be8f] hover:bg-[#b6cfc6]";

  const roleSection = 
    addRoleSection === true
      ? <div className="flex flex-1 items-center justify-center">
          <div className="rounded-full bg-gray-100 px-2.5 py-1">
            <h3 className="wrap-break-word text-center text-xs font-medium text-black">
              <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#a8be8f] text-[#3d3461] capitalize">
              {userRole}
              </span>
            </h3>
          </div>
        </div>
      : ""

  return (
    <div className="flex w-full flex-col justify-between rounded-xl border-2 border-[#3d3461] bg-gray-100 p-4 shadow-lg">
      {roleSection}

      <div className="flex flex-1 items-center justify-center">
        <h3 className="truncate whitespace-nowrap text-center text-lg font-semibold text-black w-full">
          {groupName}
        </h3>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {/* Open button */}
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-md bg-[#3d3461] py-2 text-sm font-medium text-white transition hover:bg-[#544a85]"
        >
          {t("open")}
        </button>
      </div>
    </div>
  );
}