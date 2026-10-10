"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddGroupModal } from "@/app/components/homepage/add-group-modal";
import { DashboardHeader } from "@/app/components/homepage/dashboard-header";
import { OwnedGroupsSection } from "@/app/components/homepage/owned-groups-section";
import { JoinedGroupsSection } from "@/app/components/homepage/joined-groups-section";
import { usePaginatedGroups } from "@/app/lib/hooks/use-paginated-groups";
import type { GroupItem } from "./components/homepage/group-card";

export default function Home() {
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const owned = usePaginatedGroups({ endpoint: "owned" });
  const joined = usePaginatedGroups({ endpoint: "joined" });

  useEffect(() => {
    if (!hasSearched) {
      owned.fetchInitial();
      joined.fetchInitial();
      setHasSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearched]);

  const openGroup = (group: GroupItem) => {
    const groupName = group.Group.name;
    const groupId = group.User_Group.group_id;
    const role = group.User_Group.role;
    router.push(`/group/${encodeURIComponent(groupName)}?groupId=${groupId}&role=${role}`);
  };

  const createGroup = async (groupName: string) => {
    try {
      const response = await fetch(`/api/backend/groups/${groupName}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Something went wrong");

      setIsAddGroupModalOpen(false);
      await owned.refresh();
    } catch (err) {
      alert(err);
    }
  };

  const joinGroup = async (joinCode: string) => {
    try {
      const response = await fetch(`/api/backend/invite/code/join/${joinCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Something went wrong");

      await joined.refresh();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#b6cfc6] to-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <DashboardHeader />

        <div className="grid gap-8 lg:grid-cols-2">
          <OwnedGroupsSection
            groups={owned.items}
            loading={owned.loading}
            refreshing={owned.refreshing}
            hasMore={owned.hasMore}
            onLoadMore={owned.loadMore}
            onOpenGroup={openGroup}
            onAddGroupClick={() => setIsAddGroupModalOpen(true)}
          />

          <JoinedGroupsSection
            groups={joined.items}
            loading={joined.loading}
            refreshing={joined.refreshing}
            hasMore={joined.hasMore}
            onLoadMore={joined.loadMore}
            onOpenGroup={openGroup}
            onJoin={joinGroup}
          />
        </div>
      </div>

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onCreate={createGroup}
      />
    </main>
  );
}