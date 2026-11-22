"use client";

import Link from "next/link";
import { CalendarDays, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty";
import type { BookingStatus } from "@/lib/db/schema";

export const statusLabels = {
  nl: {
    pending: "In afwachting",
    accepted: "Geaccepteerd",
    rejected: "Afgewezen",
    completed: "Afgerond",
    cancelled: "Geannuleerd",
  },
  en: {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Declined",
    completed: "Completed",
    cancelled: "Cancelled",
  },
};
export function BookingBadge({ status }: { status: BookingStatus }) {
  const { language } = useLanguage();
  return (
    <Badge variant={status === "accepted" ? "default" : "secondary"}>
      {statusLabels[language][status]}
    </Badge>
  );
}
export function AccountHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function AccountEmpty({
  title,
  description,
  icon: Icon = CalendarDays,
  discover = false,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  discover?: boolean;
}) {
  const nl = useLanguage().language === "nl";
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {discover && (
        <EmptyContent>
          <Button asChild>
            <Link href="/">
              {nl ? "Ontdek professionals" : "Discover professionals"}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
export function euro(cents: number, nl: boolean) {
  return new Intl.NumberFormat(nl ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
export function eventDate(value: string, nl: boolean) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    nl ? "nl-NL" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );
}
