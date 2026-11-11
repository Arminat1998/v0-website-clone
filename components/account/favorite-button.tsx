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
}: {
  professionalId: string;
  professionalType: FavoriteType;
  initialSaved?: boolean;
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
  async function toggle() {
    if (!session) {
      router.push(
        `/?login=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
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
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        type="button"
        aria-pressed={saved}
        disabled={busy || isPending || isLoading || Boolean(loadError)}
        onClick={toggle}
      >
        {busy ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Heart fill={saved ? "currentColor" : "none"} />
        )}
        {saved ? (nl ? "Bewaard" : "Saved") : nl ? "Bewaren" : "Save"}
      </Button>
      {(error || loadError) && (
        <p className="text-sm text-destructive" role="alert">
          {error ||
            (nl
              ? "Favorieten niet beschikbaar. Vernieuw de pagina."
              : "Favorites unavailable. Refresh the page.")}
        </p>
      )}
    </div>
  );
}
