"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "@/app/components/navigation/language-switcher"

type SearchResult = {
    lat: string
    lon: string
    display_name: string
}

export default function Register() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const t = useTranslations("register")
    const tCommon = useTranslations("common")

    const [locationQuery, setLocationQuery] = useState("")
    const [locationResults, setLocationResults] = useState<SearchResult[]>([])
    const [locationSearching, setLocationSearching] = useState(false)
    const [locationError, setLocationError] = useState("")
    const [selectedLocation, setSelectedLocation] = useState<{
        latitude: number
        longitude: number
        name: string
    } | null>(null)

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    async function searchLocation(query: string) {
        if (!query.trim()) {
            setLocationResults([])
            return
        }

        setLocationSearching(true)
        setLocationError("")

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=za&viewbox=18.3,-34.2,19.0,-33.9&q=${encodeURIComponent(query)}`,
                { headers: { Accept: "application/json" } },
            )

            if (!response.ok) {
                throw new Error(`Search failed with status ${response.status}`)
            }

            const data = (await response.json()) as SearchResult[]
            setLocationResults(data)

            if (data.length === 0) {
                setLocationError(t("noPlacesFound"))
            }
        } catch (err) {
            setLocationError(
                t("searchFailed", {
                    error: err instanceof Error ? err.message : tCommon("unknownError"),
                }),
            )
        } finally {
            setLocationSearching(false)
        }
    }

    function handleLocationSearchChange(value: string) {
        setLocationQuery(value)
        setSelectedLocation(null)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchLocation(value)
        }, 500)
    }

    function handleSelectLocation(result: SearchResult) {
        const latitude = parseFloat(result.lat)
        const longitude = parseFloat(result.lon)
        setSelectedLocation({
            latitude,
            longitude,
            name: result.display_name,
        })
        setLocationQuery(result.display_name)
        setLocationResults([])
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"))
            return
        }

        if (!selectedLocation) {
            setError(t("selectHomeLocation"))
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/backend/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: {
                        username,
                        email,
                        password,
                    },
                    location: {
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                    },
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || tCommon("somethingWentWrong"))
            }

            router.push("/login")
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError(t("unexpectedError"))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand-mid to-brand-light px-4 py-10">
            <div className="fixed absolute right-4 top-4 z-50">
                <LanguageSwitcher />
            </div>

            <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(/images/Register_Background.png)` }}
                aria-hidden="true"
            />
            <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/30 bg-white/95 shadow-2xl shadow-brand-dark/25 backdrop-blur-sm">
                <div className="p-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <p className="text-sm uppercase tracking-[0.3em] text-brand-dark/70">{t("heading")}</p>
                        <h2 className="mt-2 text-3xl font-semibold text-balance text-brand-dark">{t("createTitle")}</h2>
                        <p className="mt-3 text-sm text-slate-600">{t("createSubtitle")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-brand-dark">{t("username")}</span>
                            <input
                                type="text"
                                name="username"
                                placeholder={t("usernamePlaceholder")}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                                className="w-full rounded-3xl border border-brand-mid bg-brand-light/90 px-4 py-3 text-base text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-brand-dark">{t("email")}</span>
                            <input
                                type="email"
                                name="email"
                                placeholder={t("emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full rounded-3xl border border-brand-mid bg-brand-light/90 px-4 py-3 text-base text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20"
                            />
                        </label>

                        <div>
                            <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-brand-dark">{t("password")}</label>
                            <div className="relative">
                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder={t("passwordPlaceholder")}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-3xl border border-brand-mid bg-brand-light/90 px-4 py-3 pr-12 text-base text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                                    aria-controls="register-password"
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/70 transition hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/40"
                                >
                                    {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-medium text-brand-dark">{t("confirmPassword")}</label>
                            <div className="relative">
                                <input
                                    id="register-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder={t("confirmPasswordPlaceholder")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-3xl border border-brand-mid bg-brand-light/90 px-4 py-3 pr-12 text-base text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                                    aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                                    aria-controls="register-confirm-password"
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-brand-dark/70 transition hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/40"
                                >
                                    {showConfirmPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                                </button>
                            </div>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-brand-dark">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    {t("homeLocation")}
                                </div>
                            </span>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t("homeLocationPlaceholder")}
                                    value={locationQuery}
                                    onChange={(e) => handleLocationSearchChange(e.target.value)}
                                    className="w-full rounded-3xl border border-brand-mid bg-brand-light/90 px-4 py-3 text-base text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20"
                                />
                                {locationSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg
                                            className="animate-spin h-4 w-4 text-brand-dark/50"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0v12h12v-4a7.962 7.962 0 01-6-3.709z"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {locationError && (
                                <p className="mt-2 text-sm font-medium text-red-600">{locationError}</p>
                            )}

                            {locationResults.length > 0 && (
                                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                                    {locationResults.map((result) => (
                                        <li key={result.lat + result.lon}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectLocation(result)}
                                                className="w-full rounded-2xl bg-brand-light/40 px-3 py-2 text-left text-sm text-brand-dark transition hover:bg-brand-light/60"
                                            >
                                                {result.display_name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {selectedLocation && (
                                <p className="mt-2 text-sm text-brand-dark/70">
                                    {t("selectedLocation", { name: selectedLocation.name })}
                                </p>
                            )}
                        </label>

                        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-3xl bg-brand-dark px-4 py-3 text-base font-semibold text-white transition hover:bg-[#312a51] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? t("creatingAccount") : t("createAccount")}
                        </button>

                        <p className="text-center text-sm text-slate-600">
                            {t("alreadyHaveAccount")}{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-brand-dark underline-offset-4 hover:underline"
                            >
                                {t("signIn")}
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    )
}
