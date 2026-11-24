"use server";

import { withoutValues } from "@/lib/log-error";
import { and, desc, eq, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  bookings,
  customerProfiles,
  customerFavorites,
  customerNotifications,
  invoices,
  notifications,
} from "@/lib/db/schema";
import { paymentSummary, type CustomerInvoice } from "@/lib/bookings/payments";
import { isBookingId } from "@/lib/bookings/booking-input";
import { getSession } from "@/lib/session";
import {
  customerProfileSchema,
  type CustomerProfileInput,
  type FavoriteItem,
} from "@/lib/customer-types";
import { resolveCustomerProfessional, resolveCustomerProfessionals } from "@/lib/customer-catalog";
import { getArtistPath } from "@/lib/artist-slug";
import type { Artist, Photographer } from "@/lib/smart-search";
import { getProfessionalProfileSummary, listLivePhotographers, listLiveProfessionalArtists } from "@/lib/professional-artist";
import { isAllround } from "@/lib/profile-options";
import { hasAudioFile } from "@/lib/bookings/audio";
import { todayIso } from "@/lib/bookings/format";
import { PACKAGE_OPTION_ID } from "@/lib/bookings/pricing";
import {
  rateCents,
  replacementHref,
  scoreReplacement,
  sharedGenres,
  rateDiffPercent,
  MIN_MATCH,
  type BookingTemplate,
  type ReplacementProfile,
  type ReplacementSuggestion,
} from "@/lib/bookings/replacement";

async function customerUser() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "user")
    throw new Error("Unauthorized");
  return session.user;
}

export async function getCustomerProfile(): Promise<
  CustomerProfileInput & { email: string; image: string | null }
> {
  const account = await customerUser();
  const [row] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, account.id))
    .limit(1);
  const [firstName, ...rest] = account.name.split(" ");
  return {
    firstName: row?.firstName || firstName,
    lastName: row?.lastName || rest.join(" "),
    phone: row?.phone ?? account.phone ?? "",
    customerType: row?.customerType ?? "private",
    companyName: row?.companyName ?? "",
    billingStreet: row?.billingStreet ?? "",
    billingHouseNumber: row?.billingHouseNumber ?? "",
    billingPostalCode: row?.billingPostalCode ?? "",
    billingCity: row?.billingCity ?? "",
    billingCountry: row?.billingCountry ?? "Nederland",
    vatNumber: row?.vatNumber ?? "",
    email: account.email,
    image: account.image ?? null,
  };
}

export async function saveCustomerProfile(input: CustomerProfileInput) {
  return withoutValues("Failed to save the customer profile:", () => runSaveCustomerProfile(input));
}

async function runSaveCustomerProfile(input: CustomerProfileInput) {
  const account = await customerUser();
  const result = customerProfileSchema.safeParse(input);
  if (!result.success) return { ok: false as const };
  await db
    .insert(customerProfiles)
    .values({ ...result.data, userId: account.id })
    .onConflictDoUpdate({
      target: customerProfiles.userId,
      set: { ...result.data, updatedAt: new Date() },
      setWhere: eq(customerProfiles.userId, account.id),
    });
  revalidatePath("/account", "layout");
  return { ok: true as const };
}

export type CancelBookingResult = { ok: true } | { ok: false; error: "NOT_FOUND" | "NOT_CANCELLABLE" };

/** The customer withdraws an open request. Only the owner can do it, and only while the professional has not answered. */
export async function cancelBookingRequest(id: number): Promise<CancelBookingResult> {
  return withoutValues("Failed to cancel the booking request:", () => runCancelBookingRequest(id));
}

async function runCancelBookingRequest(id: number): Promise<CancelBookingResult> {
  const account = await customerUser();
  if (!isBookingId(id)) return { ok: false, error: "NOT_FOUND" };
  const cancelled = await db.transaction(async (tx) => {
    // The owner and the pending status are in the condition, so a second click or someone else's id changes nothing.
    const updated = await tx
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(bookings.id, id), eq(bookings.customerId, account.id), eq(bookings.status, "pending")))
      .returning({ professionalId: bookings.professionalId, eventName: bookings.eventName });
    if (!updated.length) return null;
    await tx
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.bookingId, id), eq(notifications.professionalId, updated[0].professionalId)));
    await tx.insert(notifications).values({
      professionalId: updated[0].professionalId,
      bookingId: id,
      type: "reminder",
      title: "Aanvraag ingetrokken",
      body: `De klant heeft de aanvraag voor ${updated[0].eventName} geannuleerd.`,
    });
    return updated[0];
  });
  revalidatePath("/account", "layout");
  revalidatePath("/dashboard", "layout");
  if (cancelled) return { ok: true };
  const [existing] = await db
    .select({ status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.customerId, account.id)))
    .limit(1);
  return { ok: false, error: existing ? "NOT_CANCELLABLE" : "NOT_FOUND" };
}

export async function getCustomerBooking(id: number) {
  const account = await customerUser();
  if (!isBookingId(id)) return null;
  const [row] = await db
    .select({
      id: bookings.id,
      professionalName: bookings.professionalName,
      professionalId: bookings.professionalId,
      professionalType: bookings.professionalType,
      status: bookings.status,
      eventName: bookings.eventName,
      eventDate: bookings.eventDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      eventTypes: bookings.eventTypes,
      musicGenres: bookings.musicGenres,
      capacity: bookings.capacity,
      description: bookings.description,
      specialRequests: bookings.specialRequests,
      dressCode: bookings.dressCode,
      // Files play through audioUrl(id, kind) from lib/bookings/audio; hasAudioFile tells if there is a file.
      playlistLink: bookings.playlistLink,
      openingDanceLink: bookings.openingDanceLink,
      openingDanceFileName: bookings.openingDanceFileName,
      lastSongLink: bookings.lastSongLink,
      lastSongFileName: bookings.lastSongFileName,
      equipment: bookings.equipment,
      street: bookings.street,
      houseNumber: bookings.houseNumber,
      houseNumberExt: bookings.houseNumberExt,
      postalCode: bookings.postalCode,
      city: bookings.city,
      country: bookings.country,
      firstName: bookings.firstName,
      lastName: bookings.lastName,
      email: bookings.email,
      phone: bookings.phone,
      customerType: bookings.customerType,
      companyName: bookings.companyName,
      billingStreet: bookings.billingStreet,
      billingHouseNumber: bookings.billingHouseNumber,
      billingPostalCode: bookings.billingPostalCode,
      billingCity: bookings.billingCity,
      billingCountry: bookings.billingCountry,
      vatNumber: bookings.vatNumber,
      hourlyRateCents: bookings.hourlyRateCents,
      hours: bookings.hours,
      equipmentCents: bookings.equipmentCents,
      travelCents: bookings.travelCents,
      totalCents: bookings.totalCents,
      paymentStatus: bookings.paymentStatus,
      paymentMethod: bookings.paymentMethod,
      paidAt: bookings.paidAt,
      responseMessage: bookings.responseMessage,
      rejectionReason: bookings.rejectionReason,
      createdAt: bookings.createdAt,
      respondedAt: bookings.respondedAt,
    })
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.customerId, account.id)))
    .limit(1);
  return row ?? null;
}
export type CustomerBookingDetail = NonNullable<
  Awaited<ReturnType<typeof getCustomerBooking>>
>;

/** The professional's invoice for one of the client's own bookings, without receipts or files. */
export async function getCustomerInvoice(
  bookingId: number,
): Promise<CustomerInvoice | null> {
  const account = await customerUser();
  if (!isBookingId(bookingId)) return null;
  const [row] = await db
    .select({
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalCents: invoices.totalCents,
      lines: invoices.lines,
    })
    .from(invoices)
    .innerJoin(bookings, eq(bookings.id, invoices.bookingId))
    .where(
      and(
        eq(invoices.bookingId, bookingId),
        eq(bookings.customerId, account.id),
        eq(bookings.status, "completed"),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    lines: row.lines.map(
      ({ key, description, quantity, unitLabel, grossCents }) => ({
        key,
        description,
        quantity,
        unitLabel,
        grossCents,
      }),
    ),
  };
}

export async function getFavoriteKeys() {
  const account = await customerUser();
  return db
    .select({
      professionalId: customerFavorites.professionalId,
      professionalType: customerFavorites.professionalType,
    })
    .from(customerFavorites)
    .where(eq(customerFavorites.userId, account.id));
}

export async function getCustomerFavorites(): Promise<FavoriteItem[]> {
  const account = await customerUser();
  const rows = await db
    .select()
    .from(customerFavorites)
    .where(eq(customerFavorites.userId, account.id))
    .orderBy(desc(customerFavorites.createdAt));
  const items = await resolveCustomerProfessionals(
    rows.map((row) => ({ id: row.professionalId, type: row.professionalType })),
  );
  return rows.map(
    (row, index) =>
      items[index] ?? {
        professionalId: row.professionalId,
        professionalType: row.professionalType,
        name: "",
        specialty: "",
        location: "",
        price: "",
        image: null,
        available: false,
        href: "/",
      },
  );
}

type FavoriteInput = {
  professionalId: string;
  professionalType: "artist" | "photographer";
  saved: boolean;
};

export async function setCustomerFavorite(input: FavoriteInput) {
  return withoutValues("Failed to save the favorite:", () => runSetCustomerFavorite(input));
}

async function runSetCustomerFavorite(input: FavoriteInput) {
  const account = await customerUser();
  const parsed = z
    .object({
      professionalId: z.string().min(1).max(100),
      professionalType: z.enum(["artist", "photographer"]),
      saved: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { professionalId, professionalType, saved } = parsed.data;
  if (saved) {
    if (!(await resolveCustomerProfessional(professionalId, professionalType)))
      return { ok: false as const };
    await db
      .insert(customerFavorites)
      .values({ userId: account.id, professionalId, professionalType })
      .onConflictDoNothing();
  } else {
    await db
      .delete(customerFavorites)
      .where(
        and(
          eq(customerFavorites.userId, account.id),
          eq(customerFavorites.professionalId, professionalId),
          eq(customerFavorites.professionalType, professionalType),
        ),
      );
  }
  revalidatePath("/account", "layout");
  return { ok: true as const };
}

export async function getCustomerNotifications() {
  const account = await customerUser();
  const rows = await db
    .select({
      id: customerNotifications.id,
      bookingId: customerNotifications.bookingId,
      kind: customerNotifications.status,
      read: customerNotifications.read,
      createdAt: customerNotifications.createdAt,
      eventName: bookings.eventName,
      professionalName: bookings.professionalName,
      booking: {
        status: bookings.status,
        totalCents: bookings.totalCents,
        paymentStatus: bookings.paymentStatus,
      },
      // The oldest invoice of a booking is the one in use.
      invoiceTotalCents: sql<number | null>`(
        select ${invoices.totalCents} from ${invoices}
        where ${invoices.bookingId} = ${bookings.id}
        order by ${invoices.id} limit 1)`,
    })
    .from(customerNotifications)
    .innerJoin(
      bookings,
      and(
        eq(bookings.id, customerNotifications.bookingId),
        eq(bookings.customerId, account.id),
      ),
    )
    .where(eq(customerNotifications.userId, account.id))
    .orderBy(desc(customerNotifications.createdAt))
    .limit(100);
  // What is still open is worked out now, so an old notice never asks for an amount that is paid.
  return rows.map(({ booking, invoiceTotalCents, ...row }) => ({
    ...row,
    dueCents:
      paymentSummary(
        booking,
        booking.status === "completed" && invoiceTotalCents !== null
          ? { totalCents: invoiceTotalCents }
          : null,
      ).due?.cents ?? 0,
  }));
}
export type CustomerNotice = Awaited<
  ReturnType<typeof getCustomerNotifications>
>[number];

export async function getCustomerUnreadCount() {
  const account = await customerUser();
  const [result] = await db
    .select({ value: count() })
    .from(customerNotifications)
    .where(
      and(
        eq(customerNotifications.userId, account.id),
        eq(customerNotifications.read, false),
      ),
    );
  return result.value;
}

export async function markCustomerNotificationsRead(id?: number) {
  const account = await customerUser();
  if (id !== undefined && !isBookingId(id))
    throw new Error("Invalid notification");
  await withoutValues("Failed to mark notifications read:", () => db
    .update(customerNotifications)
    .set({ read: true })
    .where(
      and(
        eq(customerNotifications.userId, account.id),
        eq(customerNotifications.read, false),
        id === undefined ? undefined : eq(customerNotifications.id, id),
      ),
    ));
  revalidatePath("/account", "layout");
}

/** Requests that are over can be used as a template for a replacement; open and paid ones cannot. */
const REUSABLE_STATUSES = ["rejected", "cancelled"] as const;

async function reusableBooking(id: number) {
  const account = await customerUser();
  if (!isBookingId(id)) return null;
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.customerId, account.id)))
    .limit(1);
  if (!row) return null;
  const expired = row.status === "pending" && row.eventDate < todayIso();
  if (!expired && !(REUSABLE_STATUSES as readonly string[]).includes(row.status)) return null;
  return row;
}

/**
 * The wishes of a rejected, cancelled or expired request, kept in the customer's own account (the request itself),
 * so a replacement does not have to be filled in again. Personal details come from the profile, files are not copied.
 */
export async function getBookingTemplate(id: number): Promise<BookingTemplate | null> {
  try {
    const row = await reusableBooking(id);
    if (!row) return null;
    return {
      fromBookingId: row.id,
      professionalType: row.professionalType === "photographer" ? "photographer" : "artist",
      previousProfessionalName: row.professionalName,
      eventDate: row.eventDate >= todayIso() ? row.eventDate : "",
      eventName: row.eventName,
      startTime: row.startTime,
      endTime: row.endTime,
      eventTypes: row.eventTypes,
      musicGenres: row.musicGenres,
      capacity: row.capacity ? String(row.capacity) : "",
      description: row.description ?? "",
      specialRequests: row.specialRequests ?? "",
      dressCode: row.dressCode ?? "",
      playlistLink: row.playlistLink ?? "",
      openingDanceLink: row.openingDanceLink ?? "",
      lastSongLink: row.lastSongLink ?? "",
      street: row.street ?? "",
      houseNumber: row.houseNumber ?? "",
      houseNumberExt: row.houseNumberExt ?? "",
      postalCode: row.postalCode ?? "",
      city: row.city,
      country: row.country ?? "",
      wantsPackage: row.equipment.includes(PACKAGE_OPTION_ID),
      hadEquipment: row.equipment.length > 0,
      hadMusicFiles: hasAudioFile(row.openingDanceFileName) || hasAudioFile(row.lastSongFileName),
    };
  } catch (error) {
    console.error("Failed to load the booking template:", withoutValuesMessage(error));
    return null;
  }
}

function withoutValuesMessage(error: unknown) {
  return error instanceof Error ? error.name : "unknown";
}

/** The professionals that come closest to the one who declined or was cancelled: same kind of act, genres, rate and area. */
export async function getReplacementSuggestions(id: number): Promise<ReplacementSuggestion[]> {
  try {
    const row = await reusableBooking(id);
    if (!row) return [];
    const type = row.professionalType === "photographer" ? "photographer" : "artist";
    const [summary, candidates] = await Promise.all([
      getProfessionalProfileSummary(row.professionalId),
      type === "photographer" ? listLivePhotographers() : listLiveProfessionalArtists(),
    ]);
    const previous: ReplacementProfile = {
      specialty: summary?.artistType ?? "",
      genres: summary ? summary.genres.filter((genre) => genre !== "allround") : row.musicGenres,
      allround: summary ? isAllround(summary.genres) : false,
      eventTypes: summary?.eventTypes ?? row.eventTypes,
      hourlyRateCents: summary?.hourlyRate ? Math.round(summary.hourlyRate * 100) : row.hourlyRateCents,
      city: summary?.city ?? "",
    };
    const futureDate = row.eventDate >= todayIso() ? row.eventDate : "";
    const suggestions: ReplacementSuggestion[] = [];
    for (const candidate of candidates) {
      const candidateId = String(candidate.id);
      if (candidateId === row.professionalId || candidateId === row.customerId) continue;
      if (futureDate && candidate.unavailableDates?.includes(futureDate)) continue;
      const genres = "musicStyles" in candidate ? candidate.musicStyles : (candidate as { serviceTypes?: string[] }).serviceTypes;
      const profile: ReplacementProfile = {
        specialty: candidate.specialty,
        genres: genres ?? [],
        allround: "allround" in candidate && Boolean(candidate.allround),
        eventTypes: candidate.eventTypes ?? [],
        hourlyRateCents: rateCents(candidate.price),
        city: candidate.location,
      };
      const { match, reasons } = scoreReplacement(previous, profile, row.musicGenres);
      suggestions.push({
        id: candidateId,
        type,
        name: candidate.name,
        specialty: candidate.specialty,
        location: candidate.location,
        hourlyRateCents: profile.hourlyRateCents,
        rating: candidate.rating,
        reviews: candidate.reviews,
        image: candidate.avatar ?? candidate.image ?? null,
        match,
        reasons,
        sharedGenres: sharedGenres(previous, profile, row.musicGenres),
        rateDiffPercent: rateDiffPercent(previous, profile),
        href: replacementHref(type, candidateId, row.id),
        profileHref:
          type === "artist"
            ? getArtistPath(candidate as Artist)
            : (candidate as { href?: string }).href ?? null,
        profile: candidate as Artist | Photographer,
      });
    }
    return suggestions
      .filter((item) => item.match >= MIN_MATCH)
      .sort((a, b) => b.match - a.match || b.rating - a.rating || a.name.localeCompare(b.name))
      .slice(0, 4);
  } catch (error) {
    console.error("Failed to find replacements:", withoutValuesMessage(error));
    // Thrown so the page can tell a failure apart from "no matches".
    throw new Error("replacements-failed");
  }
}
