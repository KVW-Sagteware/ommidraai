"use client";

import { useTranslations } from "next-intl";
import { TrashIcon } from "lucide-react";
import type { Role } from "./types";

interface LocationsCardProps {
  locations: string[];
  currentUserRole: Role;
  isDeletingLocation: boolean;
  onAddLocation: () => void;
  onRemoveLocation: (locationName: string) => void;
}

export function LocationsCard({
  locations,
  currentUserRole,
  isDeletingLocation,
  onAddLocation,
  onRemoveLocation,
}: LocationsCardProps) {
  const t = useTranslations("group");

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {t("locations")}
        </h2>

        {currentUserRole !== "guest" && (
          <button
            type="button"
            onClick={onAddLocation}
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
          >
            +
          </button>
        )}
      </div>

      {locations.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("noLocations")}
        </p>
      ) : (
        <ul className="space-y-3">
          {locations.map((location, index) => (
            <li
              key={`${location}-${index}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-gray-700">{location}</span>
              {currentUserRole !== "member" && (
                <button
                  type="button"
                  onClick={() => onRemoveLocation(location)}
                  disabled={isDeletingLocation}
                  className="rounded-md p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t("deleteLocation", { location })}
                >
                  <TrashIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
