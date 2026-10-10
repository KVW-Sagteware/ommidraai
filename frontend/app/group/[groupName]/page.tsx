"use client";

import { useParams, useSearchParams } from "next/navigation";
import { GroupPageContent } from "@/app/components/groups/group-page-content";
import type { Role } from "@/app/components/groups/types";

export default function GroupPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const groupName = decodeURIComponent(
    Array.isArray(params.groupName)
      ? params.groupName[0]
      : params.groupName || "Group"
  );

  const groupId = searchParams.get("groupId");
  const roleParam = searchParams.get("role") as Role | null;
  const currentUserRole: Role = roleParam ?? "member";

  return (
    <GroupPageContent
      groupId={groupId}
      groupName={groupName}
      currentUserRole={currentUserRole}
    />
  );
}
