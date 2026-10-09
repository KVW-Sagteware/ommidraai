"use client";

import { HomePageContent } from "@/app/components/homepage/home-page-content";
import { useLocalStorageGroups } from "@/app/components/homepage/hooks/use-local-storage-groups";

export default function HomePage() {
  const {
    myGroups,
    memberGroups,
    createGroup,
    deleteGroup,
    leaveGroup,
  } = useLocalStorageGroups();

  return (
    <HomePageContent
      myGroups={myGroups}
      memberGroups={memberGroups}
      onCreateGroup={createGroup}
      onDeleteGroup={deleteGroup}
      onLeaveGroup={leaveGroup}
    />
  );
}