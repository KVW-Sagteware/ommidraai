"use client";

import { useState, useEffect, useCallback } from "react";
import type { GroupItem } from "@/app/lib/types";

interface UseLocalStorageGroupsReturn {
  myGroups: GroupItem[];
  memberGroups: GroupItem[];
  loaded: boolean;
  createGroup: (groupName: string) => void;
  deleteGroup: (group: GroupItem) => void;
  leaveGroup: (group: GroupItem) => void;
}

const MY_GROUPS_KEY = "myGroups";
const MEMBER_GROUPS_KEY = "memberGroups";

function loadGroups(key: string): GroupItem[] {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useLocalStorageGroups(): UseLocalStorageGroupsReturn {
  const [myGroups, setMyGroups] = useState<GroupItem[]>(() =>
    loadGroups(MY_GROUPS_KEY)
  );
  const [memberGroups, setMemberGroups] = useState<GroupItem[]>(() =>
    loadGroups(MEMBER_GROUPS_KEY)
  );
  const [loaded] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(MY_GROUPS_KEY, JSON.stringify(myGroups));
  }, [myGroups, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(MEMBER_GROUPS_KEY, JSON.stringify(memberGroups));
  }, [memberGroups, loaded]);

  const createGroup = useCallback((groupName: string) => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      return;
    }

    const alreadyExists = myGroups.some(
      (group) =>
        group.Group.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      alert("A group with that name already exists.");
      return;
    }

    setMyGroups((prev) => [
      ...prev,
      {
        Group: { name: trimmedName },
        User_Group: {
          user_id: 0,
          group_id: Date.now(),
          role: "owner",
          car_capacity: 0,
          is_passenger: false,
        },
      },
    ]);
  }, [myGroups]);

  const deleteGroup = useCallback((group: GroupItem) => {
    setMyGroups((prev) => prev.filter((item) => item !== group));
  }, []);

  const leaveGroup = useCallback((group: GroupItem) => {
    setMemberGroups((prev) => prev.filter((item) => item !== group));
  }, []);

  return {
    myGroups,
    memberGroups,
    loaded,
    createGroup,
    deleteGroup,
    leaveGroup,
  };
}