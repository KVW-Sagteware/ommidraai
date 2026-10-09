"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LatLngBounds, LayerGroup, PointExpression } from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import { renderToString } from "react-dom/server";
import DriverIcon from "./ui/Driver";
import LocationIcon from "./ui/Location";

const DEFAULT_CENTER: [number, number] = [-25.8587, 28.1891];
const DEFAULT_ZOOM = 6;

// OSRM polylines are encoded with precision 5 by default.
const POLYLINE_PRECISION = 5;

// Formats a distance in metres as a readable kilometre string (null when no
// valid distance is available yet).
function formatDistance(distanceMeters: number | null | undefined): string | null {
    if (
        typeof distanceMeters !== "number" ||
        !Number.isFinite(distanceMeters) ||
        distanceMeters <= 0
    ) {
        return null;
    }

    const km = distanceMeters / 1000;
    return km >= 100 ? km.toFixed(0) : km.toFixed(1);
}

type Position = [number, number];

type MapNode = {
    latitude: number;
    longitude: number;
};

const ROUTE_STYLE = {
    color: "#3b82f6",
    weight: 5,
    opacity: 0.7,
};

// One colour per leg of the journey. Because every leg is drawn in its own
// colour, a road that is travelled more than once appears as distinct bands
// instead of a single overlapping line.
const LEG_COLORS = [
	"#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
];

// One colour per driver, used when the owner enables "show all routes".
const DRIVER_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
];

function squaredDistance(
    position: Position,
    latitude: number,
    longitude: number
): number {
    const dLat = position[0] - latitude;
    const dLng = position[1] - longitude;
    return dLat * dLat + dLng * dLng;
}

// Finds the decoded-shape-point index closest to a route node, so a path's
// stop order can be mapped onto the continuous OSRM geometry.
function nearestIndex(
    positions: Position[],
    latitude: number,
    longitude: number
): number {
    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let i = 0; i < positions.length; i++) {
        const distance = squaredDistance(
            positions[i],
            latitude,
            longitude
        );
        if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i;
        }
    }

    return bestIndex;
}

// Splits the decoded geometry into one polyline leg per consecutive pair of
// route nodes (start -> pickup_1 -> ... -> pickup_n -> destination). This is
// what lets repeated roads be shown as separate coloured bands.
function buildLegs(positions: Position[], points: MapNode[]): Position[][] {
    const legs: Position[][] = [];

    if (points.length < 2) {
        return legs;
    }

    // Without geometry, fall back to straight lines between the nodes.
    if (!positions || positions.length === 0) {
        for (let i = 0; i < points.length - 1; i++) {
            legs.push([
                [points[i].latitude, points[i].longitude],
                [points[i + 1].latitude, points[i + 1].longitude],
            ]);
        }
        return legs;
    }

    // Map each route node onto the decoded geometry, enforcing monotonic
    // stop order along the line.
    const nodeIndexes: number[] = [];
    let previousIndex = -1;

    for (let i = 0; i < points.length; i++) {
        let index = nearestIndex(
            positions,
            points[i].latitude,
            points[i].longitude
        );

        if (index < previousIndex) {
            index = previousIndex;
        }

        index = Math.min(index, positions.length - 1);
        nodeIndexes.push(index);
        previousIndex = index;
    }

    for (let i = 0; i < nodeIndexes.length - 1; i++) {
        const start = nodeIndexes[i];
        let end = nodeIndexes[i + 1];

        // Guard against consecutive nodes snapping to the same shape point.
        if (end <= start) {
            if (end + 1 < positions.length) {
                end = start + 1;
            } else {
                continue;
            }
        }

        legs.push(positions.slice(start, end + 1));
    }

    return legs;
}

type RouteDisplayMode = "antpath" | "polyline";

function addRoutePath(
    L: LeafletModule,
    layer: LayerGroup,
    positions: Position[],
    color: string,
    routeMode: RouteDisplayMode,
    options: { weight: number; opacity: number }
): void {
    if (positions.length < 2) {
        return;
    }

    const sharedOptions = {
        color,
        weight: options.weight,
        opacity: options.opacity,
    };

    if (routeMode === "antpath") {
        const antPathFactory = (L as typeof L & {
            polyline?: {
                antPath?: (
                    points: Position[],
                    config: Record<string, unknown>
                ) => { addTo: (target: LayerGroup) => unknown };
            };
        }).polyline?.antPath;

        if (antPathFactory) {
            antPathFactory(positions, {
                ...sharedOptions,
                pulseColor: "#ffffff",
                dashArray: [10, 20],
                delay: 600,
                reverse: false,
            }).addTo(layer);
            return;
        }
    }

    L.polyline(positions, sharedOptions).addTo(layer);
}

export type MapPoint = {
    label: string;
    latitude: number;
    longitude: number;
};

export type WorldMapRoute = {
    id: string;
    driver: string;
    ranking: number;
    destination: string;
    distance: number | null;
    geometry: string | null;
    // Every node along the path in order: driver start, any passengers, destination.
    points: MapPoint[];
};

type WorldMapProps = {
    routes: WorldMapRoute[];
    allRoutes: WorldMapRoute[];
    passengerDriver: string | null;
    isAdmin: boolean;
};

type LeafletModule = typeof import("leaflet");

export function WorldMap({
    routes,
    allRoutes,
    passengerDriver,
    isAdmin,
}: WorldMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const routeLayerRef = useRef<LayerGroup | null>(null);
    const leafletRef = useRef<LeafletModule | null>(null);

    const [ready, setReady] = useState(false);
    const [prevRoutes, setPrevRoutes] = useState(routes);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showAllRoutes, setShowAllRoutes] = useState(false);
    const [routeDisplayMode, setRouteDisplayMode] =
        useState<RouteDisplayMode>("antpath");
    const t = useTranslations("group");

    // A passenger has no route of their own to draw, so show a notice instead.
    const passengerMessage = passengerDriver
        ? t("worldMapPassenger", { driver: passengerDriver })
        : null;

    // Default back to the best-ranked (first) destination whenever a new
    // route list is received. Adjusted during render (not in an effect) to
    // avoid the extra render cycle a setState-in-effect would cause.
    if (prevRoutes !== routes) {
        setPrevRoutes(routes);
        setSelectedIndex(0);
    }

    const selectedRoute = routes[selectedIndex] ?? null;
    const selectedDistance = formatDistance(selectedRoute?.distance);

    // The routes to draw: either just the current user's route to the
    // selected destination, or every driver's route to that destination
    // (the owner's "show all routes" toggle).
    const renderList = useMemo(() => {
        if (showAllRoutes) {
            const destination =
                selectedRoute?.destination ?? allRoutes[0]?.destination ?? null;

            if (!destination) {
                return [];
            }

            return allRoutes.filter(
                (route) => route.destination === destination
            );
        }

        return selectedRoute ? [selectedRoute] : [];
    }, [showAllRoutes, allRoutes, selectedRoute]);

    // Decode every route that is currently being drawn into
    // [latitude, longitude] pairs.
    const decodedByRoute = useMemo(() => {
        const decoded = new Map<string, Position[]>();

        for (const route of renderList) {
            if (!route.geometry) {
                decoded.set(route.id, []);
                continue;
            }

            try {
                decoded.set(
                    route.id,
                    polyline.decode(route.geometry, POLYLINE_PRECISION)
                );
            } catch {
                decoded.set(route.id, []);
            }
        }

        return decoded;
    }, [renderList]);

    // Give every driver a stable colour. The current user always gets the
    // first colour so their own route stays easy to spot in the overview.
    const driverColors = useMemo(() => {
        const colors = new Map<string, string>();
        const currentDriver = routes[0]?.driver;

        if (currentDriver) {
            colors.set(currentDriver, DRIVER_COLORS[0]);
        }

        for (const route of renderList) {
            if (colors.has(route.driver)) {
                continue;
            }

            colors.set(
                route.driver,
                DRIVER_COLORS[colors.size % DRIVER_COLORS.length]
            );
        }

        return colors;
    }, [renderList, routes]);

    const hasVisibleRoute =
        renderList.length > 0 &&
        renderList.some((route) => {
            const positions = decodedByRoute.get(route.id);

            return (
                (positions && positions.length > 0) ||
                (route.points && route.points.length > 0)
            );
        });

    useEffect(() => {
        let cancelled = false;

        async function initMap() {
            // Leaflet depends on `window`, so it is only loaded on the client
            // (this keeps the component SSR-safe). The ant-path plugin is also
            // loaded here because its UMD bundle references `window` on import.
            const L = (await import("leaflet")).default;
            await import("leaflet-ant-path");

            if (cancelled || !mapContainerRef.current || mapRef.current) {
                return;
            }

            leafletRef.current = L;

            const map = L.map(mapContainerRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            routeLayerRef.current = L.layerGroup().addTo(map);

            mapRef.current = map;

            requestAnimationFrame(() => {
                if (!cancelled) {
                    map.invalidateSize();
                    setReady(true);
                }
            });
        }

        initMap();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            routeLayerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const L = leafletRef.current;
        const layer = routeLayerRef.current;

        if (!ready || !L || !layer || !mapRef.current) {
            return;
        }

        layer.clearLayers();

        let combinedBounds: LatLngBounds | null = null;

        renderList.forEach((route) => {
            const positions = decodedByRoute.get(route.id) ?? [];
            const points = route.points ?? [];
            let driverIconColor = LEG_COLORS[0];

            let bounds: LatLngBounds | null = null;

            if (positions.length > 0) {
                bounds = L.latLngBounds(positions);
            } else if (points.length >= 2) {
                bounds = L.latLngBounds(
                    points.map((point) => [
                        point.latitude,
                        point.longitude,
                    ])
                );
            }

            if (showAllRoutes) {
                // Overview mode: draw the whole route in the driver's colour
                // so every driver can be told apart at a glance.
                const color =
                    driverColors.get(route.driver) ?? ROUTE_STYLE.color;

                driverIconColor = color;
                const drawable =
                    positions.length > 1
                        ? positions
                        : points.length >= 2
                          ? (points.map(
                                (point) =>
                                    [point.latitude, point.longitude] as Position
                            ) as Position[])
                          : ([] as Position[]);

                if (drawable.length > 1) {
                    addRoutePath(L, layer, drawable, color, routeDisplayMode, {
                        weight: 5,
                        opacity: 0.9,
                    });
                }
            } else {
                // Single-user mode: a faint underlay of the whole journey
                // keeps overall continuity.
                if (positions.length > 0) {
                    addRoutePath(
                        L,
                        layer,
                        positions,
                        ROUTE_STYLE.color,
                        routeDisplayMode,
                        {
                            weight: 6,
                            opacity: 0.25,
                        }
                    );
                }

                // Draw each leg in its own colour (so a road travelled more
                // than once appears as distinct bands).
                const legs = buildLegs(positions, points);

                legs.forEach((leg, index) => {
                    const color = LEG_COLORS[index % LEG_COLORS.length];

                    addRoutePath(L, layer, leg, color, routeDisplayMode, {
                        weight: 5,
                        opacity: 0.9,
                    });
                });
            }

            // Drop a pin for every node along the path: start (green), any
            // passengers picked up in between (amber), and the destination (red).
            points.forEach((point, index) => {
                const isStart = index === 0;
                const isEnd = index === points.length - 1;
                const markerHtml = isStart
                    ? renderToString(<DriverIcon color={driverIconColor} className="w-14 h-14"/>)
                    : isEnd
                      ? renderToString(<LocationIcon color="#e74c3c"/>)
                      : renderToString(<LocationIcon color="#f59e0b"/>);

                const anchor: PointExpression = isStart
                    ? [26.25, 52.5]
                    : [15, 30];

                L.marker([point.latitude, point.longitude], {
                    icon: L.divIcon({
                        html: markerHtml,
                        className: "",
                        iconSize: [30, 30],
                        iconAnchor: anchor,
                    }),
                    title: point.label,
                }).addTo(layer);
            });

            if (bounds && bounds.isValid()) {
                combinedBounds = combinedBounds
                    ? combinedBounds.extend(bounds)
                    : bounds;
            }
        });

        if (combinedBounds) {
            mapRef.current.fitBounds(combinedBounds, { padding: [40, 40] });
        }
    }, [ready, renderList, decodedByRoute, driverColors, showAllRoutes, routeDisplayMode]);

    return (
        <div className="relative flex h-[350px] w-full flex-col overflow-hidden border border-gray-300">
            {(routes.length > 0 || isAdmin) && (
                <div className="relative z-[500] flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 overflow-auto">
                    {routes.length > 0 && (
                        <>
                            <label
                                htmlFor="world-map-destination"
                                className="text-xs font-semibold text-gray-600"
                            >
                                {t("worldMapDestination")}
                            </label>

                            <select
                                id="world-map-destination"
                                value={selectedIndex}
                                onChange={(event) =>
                                    setSelectedIndex(Number(event.target.value))
                                }
                                className="flex-1 rounded border border-[#c7c7cc] bg-white px-3 py-2 text-sm text-[#3d3461] outline-none focus:border-[#3d3461]"
                            >
                                {routes.map((route, index) => (
                                    <option key={route.id} value={index}>
                                        {route.ranking}. {route.destination}
                                    </option>
                                ))}
                            </select>

                            <span className="shrink-0 rounded-lg bg-[#3d3461]/10 px-3 py-2 text-sm font-semibold text-[#3d3461]">
                                {t("worldMapTotalDistance")}:{" "}
                                {selectedDistance !== null
                                    ? t("worldMapDistanceValue", {
                                          distance: selectedDistance,
                                      })
                                    : "—"}
                            </span>
                        </>
                    )}

                    {routes.length > 0 && (
                        <div className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                            {(["antpath", "polyline"] as const).map((mode) => {
                                const isActive = routeDisplayMode === mode;

                                return (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setRouteDisplayMode(mode)}
                                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                                            isActive
                                                ? "bg-[#3d3461] text-white"
                                                : "text-gray-600 hover:bg-white"
                                        }`}
                                    >
                                        {mode === "antpath" ? t("worldMapAntPath") : t("worldMapPolyline")}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            role="switch"
                            aria-checked={showAllRoutes}
                            onClick={() => setShowAllRoutes((value) => !value)}
                            className="flex shrink-0 items-center gap-2 text-xs font-semibold text-gray-600"
                        >
                            <span
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    showAllRoutes
                                        ? "bg-[#3d3461]"
                                        : "bg-gray-300"
                                }`}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                        showAllRoutes
                                            ? "translate-x-[22px]"
                                            : "translate-x-1"
                                    }`}
                                />
                            </span>

                            {showAllRoutes
                                ? t("worldMapShowMyRoute")
                                : t("worldMapShowAllRoutes")}
                        </button>
                    )}
                </div>
            )}

            <div className="relative z-0 min-h-0 flex-1">
                {!ready && (
                    <div className="absolute inset-0 z-10 animate-pulse rounded-2xl bg-gray-200" />
                )}

                {passengerMessage && (
                    <div className="absolute inset-x-0 top-0 z-[1000] flex items-center justify-center rounded-t-2xl bg-[#3d3461]/90 px-4 py-2">
                        <p className="text-center text-[13px] font-medium text-white">
                            {passengerMessage}
                        </p>
                    </div>
                )}

                {ready && !hasVisibleRoute && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-2xl bg-gray-100/80">
                            <div className="text-center">
                                <div className="mb-3 text-5xl">🌍</div>

                                <p className="text-sm text-gray-500">
                                    {t("worldMapNoRoute")}
                                </p>
                            </div>
                        </div>
                    )}

                {showAllRoutes && renderList.length > 0 && (
                    <div className="absolute left-3 bottom-3 z-[500] max-h-[75%] overflow-y-auto rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t("worldMapAllRouteDistances")}
                        </p>

                        <ul className="mt-2 space-y-2">
                            {renderList.map((route) => {
                                const formatted = formatDistance(route.distance);
                                const color =
                                    driverColors.get(route.driver) ??
                                    ROUTE_STYLE.color;

                                return (
                                    <li
                                        key={route.id}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <span
                                            className="h-3 w-3 shrink-0 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="font-medium text-gray-700">
                                            {route.driver}
                                        </span>
                                        <span className="ml-auto pl-3 text-xs font-semibold text-gray-500">
                                            {formatted !== null
                                                ? t("worldMapDistanceValue", {
                                                      distance: formatted,
                                                  })
                                                : "—"}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <div
                    ref={mapContainerRef}
                    className="z-0 h-full w-full rounded-2xl"
                />
            </div>
        </div>
    );
}