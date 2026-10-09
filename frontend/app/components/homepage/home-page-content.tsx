"use client";

import { useState } from "react";
import { PageHeader } from "./page-header";
import { MyGroups } from "./my-group";
import { JoinedGroups } from "./joined-group";
import { AddGroupButton } from "./AddGroupButton";
import { PromptModal } from "@/app/components/ui/prompt-modal";
import type { GroupItem } from "@/app/lib/types";

interface HomePageContentProps {
  myGroups: GroupItem[];
  memberGroups: GroupItem[];
  onCreateGroup: (groupName: string) => void;
  onDeleteGroup: (group: GroupItem) => void;
  onLeaveGroup: (group: GroupItem) => void;
}

export function HomePageContent({
  myGroups,
  memberGroups,
  onCreateGroup,
  onDeleteGroup,
  onLeaveGroup,
}: HomePageContentProps) {
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand-mid to-brand-light py-8 pb-28">
      <div className="relative z-10 mx-auto w-full max-w-6xl rounded-3xl bg-white p-10 shadow-2xl">
        <PageHeader />

        {/* My Groups */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <MyGroups groups={myGroups} onDelete={onDeleteGroup} />
        </div>

        {/* Member Groups */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <JoinedGroups groups={memberGroups} onLeave={onLeaveGroup} />
        </div>
      </div>

      {/* Bottom buttons */}
      <AddGroupButton onClick={() => setShowAddGroupModal(true)} />

      {/* Add Group Modal */}
      <PromptModal
        isOpen={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        onConfirm={onCreateGroup}
      />
    </main>
  );
}