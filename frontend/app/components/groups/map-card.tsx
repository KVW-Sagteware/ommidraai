"use client";

import { useTranslations } from "next-intl";
import { WorldMap } from "./world-map";
import type { ApiAlgorithmOption, Role, WorldMapRoute } from "./types";

interface MapCardProps {
  routes: WorldMapRoute[];
  allRoutes: WorldMapRoute[];
  passengerDriver: string | null;
  currentUserRole: Role;
  selectedAlgorithm: string;
  availableAlgorithms: ApiAlgorithmOption[];
  isAlgorithmLoading: boolean;
  onAlgorithmChange: (algorithmId: string) => void;
}

export function MapCard({
  routes,
  allRoutes,
  passengerDriver,
  currentUserRole,
  selectedAlgorithm,
  availableAlgorithms,
  isAlgorithmLoading,
  onAlgorithmChange,
}: MapCardProps) {
  const t = useTranslations("group");

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-300">
      {availableAlgorithms.length > 0 && (
        <div className="flex items-center justify-end gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <label
            htmlFor="algorithm-select"
            className="text-sm font-semibold text-gray-600"
          >
            {t("algorithm")}
          </label>

          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(event) => onAlgorithmChange(event.target.value)}
            disabled={isAlgorithmLoading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-[#3d3461] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {availableAlgorithms.map((algo) => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative">
        <WorldMap
          routes={routes}
          allRoutes={allRoutes}
          passengerDriver={passengerDriver}
          isAdmin={
            currentUserRole === "owner" || currentUserRole === "admin"
          }
        />

        {isAlgorithmLoading && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-gray-100/70">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#3d3461]" />
              <span className="text-sm font-semibold text-gray-700">
                {t("algorithmLoading")}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
