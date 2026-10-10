"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

interface UsePlaceSearchOptions {
  /**
   * Delay in milliseconds between the last keystroke and the request.
   * When omitted the search only runs through the returned `search()`.
   */
  debounceMs?: number;
  /** Extra query parameters merged into the Nominatim request. */
  extraParams?: Record<string, string>;
  /** Message shown when the search succeeds but finds nothing. */
  noResultsMessage: string;
  /** Builds the failure message from the underlying error description. */
  formatErrorMessage: (detail: string) => string;
  /** Called with the fresh result list, before the caller renders it. */
  onResults?: (results: SearchResult[]) => void;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Shared Nominatim place search: query state, debouncing, request state and
 * error reporting. Used by the register form, the profile location map and
 * the "add location" modal.
 */
export function usePlaceSearch({
  debounceMs,
  extraParams,
  noResultsMessage,
  formatErrorMessage,
  onResults,
}: UsePlaceSearchOptions) {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const tCommon = useTranslations("common");

  const search = useCallback(
    async (rawQuery?: string) => {
      const trimmed = (rawQuery ?? query).trim();

      if (!trimmed) {
        setResults([]);
        return;
      }

      const requestId = ++requestIdRef.current;

      setSearching(true);
      setError("");
      setResults([]);

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          limit: "5",
          q: trimmed,
          ...extraParams,
        });

        const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const data = (await response.json()) as SearchResult[];

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults(data);
        onResults?.(data);

        if (data.length === 0) {
          setError(noResultsMessage);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          formatErrorMessage(
            err instanceof Error ? err.message : tCommon("unknownError")
          )
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    },
    [
      query,
      extraParams,
      noResultsMessage,
      formatErrorMessage,
      onResults,
      tCommon,
    ]
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);

      if (!debounceMs) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        search(value);
      }, debounceMs);
    },
    [debounceMs, search]
  );

  // Programmatic text update that must not trigger a request (for example
  // after picking a result, where the text becomes the place name).
  const setQueryText = useCallback((value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setQueryState(value);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    setQueryText,
    results,
    clearResults,
    searching,
    error,
    search,
  };
}
