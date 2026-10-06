import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const BOOKING_STATUSES = ["pending", "accepted", "rejected", "completed", "cancelled"] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const PAYMENT_STATUSES = ["unpaid", "deposit_paid", "paid", "refunded"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYOUT_STATUSES = ["pending", "paid"] as const
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  professionalId: text("professional_id").notNull(),
  professionalName: text("professional_name").notNull(),
  professionalType: text("professional_type").notNull().default("artist"),
  status: text("status").$type<BookingStatus>().notNull().default("pending"),

  eventName: text("event_name").notNull(),
  eventDate: date("event_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  eventTypes: text("event_types").array().notNull().default([]),
  musicGenres: text("music_genres").array().notNull().default([]),
  capacity: integer("capacity"),
  description: text("description"),
  specialRequests: text("special_requests"),
  dressCode: text("dress_code"),

  playlistLink: text("playlist_link"),
  openingDanceLink: text("opening_dance_link"),
  openingDanceFileName: text("opening_dance_file_name"),
  lastSongLink: text("last_song_link"),
  lastSongFileName: text("last_song_file_name"),

  street: text("street"),
  houseNumber: text("house_number"),
  houseNumberExt: text("house_number_ext"),
  postalCode: text("postal_code"),
  city: text("city").notNull(),
  country: text("country"),
  distanceKm: integer("distance_km").notNull().default(0),
  equipment: text("equipment").array().notNull().default([]),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  customerType: text("customer_type").$type<"private" | "business">().notNull().default("private"),
  companyName: text("company_name"),
  billingStreet: text("billing_street"),
  billingHouseNumber: text("billing_house_number"),
  billingPostalCode: text("billing_postal_code"),
  billingCity: text("billing_city"),
  billingCountry: text("billing_country"),
  vatNumber: text("vat_number"),

  paymentMethod: text("payment_method").$type<"ideal" | "card" | "invoice">().notNull().default("ideal"),
  paymentStatus: text("payment_status").$type<PaymentStatus>().notNull().default("unpaid"),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  hourlyRateCents: integer("hourly_rate_cents").notNull().default(0),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull().default("0"),
  equipmentCents: integer("equipment_cents").notNull().default(0),
  travelCents: integer("travel_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  platformFeeCents: integer("platform_fee_cents").notNull().default(0),
  payoutCents: integer("payout_cents").notNull().default(0),
  payoutStatus: text("payout_status").$type<PayoutStatus>().notNull().default("pending"),
  paidOutAt: timestamp("paid_out_at", { withTimezone: true }),

  responseMessage: text("response_message"),
  rejectionReason: text("rejection_reason"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert

export const NOTIFICATION_TYPES = ["new_request", "payment", "payout", "reminder"] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  professionalId: text("professional_id").notNull(),
  bookingId: integer("booking_id"),
  type: text("type").$type<NotificationType>().notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Notification = typeof notifications.$inferSelect
