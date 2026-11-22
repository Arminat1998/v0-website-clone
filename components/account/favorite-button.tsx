"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getFavoriteKeys, setCustomerFavorite } from "@/app/actions/customer";
import { useLanguage } from "@/contexts/language-context";
import type { FavoriteType } from "@/lib/customer-types";

export function FavoriteButton({
  professionalId,
  professionalType,
  initialSaved = false,
  variant = "button",
  name,
}: {
  professionalId: string;
  professionalType: FavoriteType;
  initialSaved?: boolean;
  /** "icon": round heart button for on top of a card image. */
  variant?: "button" | "icon";
  /** Professional's name, used in the accessible label of the icon variant. */
  name?: string;
}) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isCustomer = session?.user.role === "user";
  const {
    data,
    mutate,
    error: loadError,
    isLoading,
  } = useSWR(isCustomer ? ["customer-favorites", session.user.id] : null, () =>
    getFavoriteKeys(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = data
    ? data.some(
        (item) =>
          item.professionalId === professionalId &&
          item.professionalType === professionalType,
      )
    : initialSaved;
  if (session && !isCustomer) return null;
  async function toggle(event?: React.MouseEvent) {
    // On a card the button sits inside a clickable card: don't open the profile.
    event?.stopPropagation();
    if (!session) {
      // Log in on top of the current page and come back to this same list or profile.
      window.dispatchEvent(
        new CustomEvent("arsi:open-login", {
          detail: { next: window.location.pathname + window.location.search },
        }),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await setCustomerFavorite({
        professionalId,
        professionalType,
        saved: !saved,
      });
      if (!result.ok) throw new Error("Favorite failed");
      await mutate();
      router.refresh();
    } catch {
      setError(
        nl
          ? "Opslaan is niet gelukt. Probeer opnieuw."
          : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const disabled = busy || isPending || isLoading || Boolean(loadError);
  const errorText =
    error ||
    (loadError
      ? nl
        ? "Favorieten niet beschikbaar. Vernieuw de pagina."
        : "Favorites unavailable. Refresh the page."
      : "");

  if (variant === "icon") {
    const label = saved
      ? nl
        ? `${name ?? "Professional"} verwijderen uit favorieten`
        : `Remove ${name ?? "professional"} from favorites`
      : nl
        ? `${name ?? "Professional"} bewaren in favorieten`
        : `Save ${name ?? "professional"} to favorites`;
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={label}
          title={label}
          disabled={disabled}
          onClick={toggle}
          className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className={saved ? "h-5 w-5 text-red-500" : "h-5 w-5"}
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
        </button>
        {errorText && (
          <p
            role="alert"
            className="absolute right-0 top-12 w-48 rounded-md bg-destructive px-2 py-1 text-xs text-white shadow-lg"
          >
            {errorText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        type="button"
        aria-pressed={saved}
        disabled={disabled}
        onClick={toggle}
      >
        {busy ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Heart fill={saved ? "currentColor" : "none"} />
        )}
        {saved ? (nl ? "Bewaard" : "Saved") : nl ? "Bewaren" : "Save"}
      </Button>
      {errorText && (
        <p className="text-sm text-destructive" role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}
