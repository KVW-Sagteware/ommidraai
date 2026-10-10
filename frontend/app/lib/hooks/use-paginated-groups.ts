import { useCallback, useRef, useState } from "react";
import type { GroupItem } from "@/app/components/homepage/group-card";

interface UsePaginatedGroupsOptions {
  endpoint: "owned" | "joined";
  pageSize?: number;
}

export function usePaginatedGroups({ endpoint, pageSize = 6 }: UsePaginatedGroupsOptions) {
  const [items, setItems] = useState<GroupItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const loadedCountRef = useRef(0);

  const fetchPage = async (pageToFetch: number, signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const url = `/api/backend/groups/get/${endpoint}?page=${pageToFetch}&size=${pageSize}`;
      const response = await fetch(url, { signal });
      const data = await response.json();

      const newItems: GroupItem[] = data.items || [];
      if (newItems.length < pageSize) setHasMore(false);

      setItems((prev) => [...prev, ...newItems]);
      loadedCountRef.current += newItems.length;
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error(`Error fetching ${endpoint} groups:`, error);
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  // Explicit trigger, called by the page once hasSearched flips false → true.
  const fetchInitial = useCallback(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, pageSize]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  };

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setRefreshing(true);

    try {
      const size = Math.max(loadedCountRef.current, pageSize);
      const url = `/api/backend/groups/get/${endpoint}?page=1&size=${size}`;
      const response = await fetch(url);
      const data = await response.json();

      const newItems: GroupItem[] = data.items || [];
      setItems(newItems);
      loadedCountRef.current = newItems.length;
      setHasMore(newItems.length >= size);
      setPage(1);
    } catch (error) {
      console.error(`Error refreshing ${endpoint} groups:`, error);
    } finally {
      isFetchingRef.current = false;
      setRefreshing(false);
    }
  }, [endpoint, pageSize]);

  return { items, loading, refreshing, hasMore, loadMore, refresh, fetchInitial };
}