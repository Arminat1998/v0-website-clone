"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImageCrop } from "@/hooks/use-image-crop";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/artist-page-types";

export function AccountProfilePhoto({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const nl = useLanguage().language === "nl";
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { requestCrop, cropDialog } = useImageCrop();
  const [current, setCurrent] = useState(image);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function report(text: string, error: boolean) {
    setMessage(text);
    setIsError(error);
  }

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      report(
        nl
          ? "Kies een JPG-, PNG-, WebP- of AVIF-afbeelding."
          : "Choose a JPG, PNG, WebP or AVIF image.",
        true,
      );
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      report(
        nl
          ? "Deze foto is te groot. Kies een foto tot 8 MB."
          : "This photo is too large. Choose one up to 8 MB.",
        true,
      );
      return;
    }
    const cropped = await requestCrop(file, { aspect: 1, round: true });
    if (!cropped) return;
    setBusy(true);
    report("", false);
    try {
      const body = new FormData();
      body.append("file", cropped);
      const response = await fetch("/api/customer-avatar", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as { image?: string };
      if (!response.ok || !result.image) throw new Error("Upload failed");
      setCurrent(result.image);
      report(
        nl ? "Je profielfoto is opgeslagen." : "Your profile photo has been saved.",
        false,
      );
      router.refresh();
    } catch {
      report(
        nl
          ? "Uploaden is niet gelukt. Probeer opnieuw."
          : "Upload failed. Please try again.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    report("", false);
    try {
      const response = await fetch("/api/customer-avatar", { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setCurrent(null);
      report(
        nl ? "Je profielfoto is verwijderd." : "Your profile photo has been removed.",
        false,
      );
      router.refresh();
    } catch {
      report(
        nl
          ? "Verwijderen is niet gelukt. Probeer opnieuw."
          : "Could not remove. Please try again.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{nl ? "Profielfoto" : "Profile photo"}</CardTitle>
        <CardDescription>
          {nl
            ? "Professionals zien deze foto bij je aanvragen en berichten."
            : "Professionals see this photo with your requests and messages."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-semibold">
            {current ? (
              <img
                src={current}
                alt={nl ? `Profielfoto van ${name}` : `Profile photo of ${name}`}
                className="size-full object-cover"
              />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="flex flex-col gap-2">
            <input
              ref={input}
              id="profile-photo"
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={choose}
              disabled={busy}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Camera />}
              {current
                ? nl
                  ? "Foto wijzigen"
                  : "Change photo"
                : nl
                  ? "Foto uploaden"
                  : "Upload photo"}
            </Button>
            {current && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={remove}
              >
                <Trash2 />
                {nl ? "Foto verwijderen" : "Remove photo"}
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {nl ? "JPG, PNG, WebP of AVIF, tot 8 MB." : "JPG, PNG, WebP or AVIF, up to 8 MB."}
            </p>
          </div>
        </div>
        {message && (
          <p role={isError ? "alert" : "status"} className="mt-4 text-sm">
            {message}
          </p>
        )}
      </CardContent>
      {cropDialog}
    </Card>
  );
}
