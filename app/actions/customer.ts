"use server";

import { withoutValues } from "@/lib/log-error";
import { and, desc, eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  bookings,
  customerProfiles,
  customerFavorites,
  customerNotifications,
  invoices,
} from "@/lib/db/schema";
import type { CustomerInvoice } from "@/lib/bookings/payments";
import { isBookingId } from "@/lib/bookings/booking-input";
import { getSession } from "@/lib/session";
import {
  customerProfileSchema,
  type CustomerProfileInput,
  type FavoriteItem,
} from "@/lib/customer-types";
import { resolveCustomerProfessional, resolveCustomerProfessionals } from "@/lib/customer-catalog";

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

export async function setCustomerFavorite(input: {
  professionalId: string;
  professionalType: "artist" | "photographer";
  saved: boolean;
}) {
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
  return db
    .select({
      id: customerNotifications.id,
      bookingId: customerNotifications.bookingId,
      status: customerNotifications.status,
      read: customerNotifications.read,
      createdAt: customerNotifications.createdAt,
      eventName: bookings.eventName,
      professionalName: bookings.professionalName,
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
  await db
    .update(customerNotifications)
    .set({ read: true })
    .where(
      and(
        eq(customerNotifications.userId, account.id),
        eq(customerNotifications.read, false),
        id === undefined ? undefined : eq(customerNotifications.id, id),
      ),
    );
  revalidatePath("/account", "layout");
}
