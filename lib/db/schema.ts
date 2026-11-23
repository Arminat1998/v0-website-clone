import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
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

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  role: text("role").notNull().default("user"),
  phone: text("phone"),
  category: text("category"),
  status: text("status").notNull().default("active"),
  statusReason: text("statusReason"),
  suspendedUntil: timestamp("suspendedUntil", { withTimezone: true }),
  bannedAt: timestamp("bannedAt", { withTimezone: true }),
})

export const userWarnings = pgTable("user_warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("warning"),
  adminName: text("admin_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
})

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  adminName: text("admin_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const blacklist = pgTable("blacklist", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  reason: text("reason"),
  adminName: text("admin_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminName: text("admin_name").notNull(),
  action: text("action").notNull(),
  targetUserId: text("target_user_id"),
  targetLabel: text("target_label"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
})

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id"),
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

/** Dates a professional blocked by hand. The table is created by lib/bookings/availability.ts on first use. */
export const professionalUnavailableDates = pgTable(
  "professional_unavailable_dates",
  {
    professionalId: text("professional_id").notNull(),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.professionalId, table.date] })],
)

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

export const artistPages = pgTable("artist_pages", {
  professionalId: text("professional_id").primaryKey(),
  bannerPath: text("banner_path"),
  avatarPath: text("avatar_path"),
  tagline: text("tagline"),
  about: text("about"),
  eventTypes: text("event_types").array().notNull().default([]),
  musicGenres: text("music_genres").array().notNull().default([]),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<{ id: string; url: string; title: string }[]>().notNull().default([]),
  socials: jsonb("socials").$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const professionalProfiles = pgTable("professional_profiles", {
  professionalId: text("professional_id").primaryKey(),
  stageName: text("stage_name").notNull().default(""),
  fullName: text("full_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  kvkNumber: text("kvk_number").notNull().default(""),
  vatNumber: text("vat_number").notNull().default(""),
  bio: text("bio").notNull().default(""),
  yearsExperience: integer("years_experience").notNull().default(0),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  minHours: integer("min_hours").notNull().default(1),
  maxHours: integer("max_hours").notNull().default(8),
  city: text("city").notNull().default(""),
  rangeKm: integer("range_km").notNull().default(100),
  artistType: text("artist_type").notNull().default(""),
  genres: text("genres").array().notNull().default([]),
  eventTypes: text("event_types").array().notNull().default([]),
  socials: jsonb("socials").$type<{ id: string; platform: string; url: string }[]>().notNull().default([]),
  minimumEquipment: jsonb("minimum_equipment")
    .$type<Record<string, { id: string; name: string; price: string; description: string; image?: string }>>()
    .notNull()
    .default({}),
  extraEquipment: jsonb("extra_equipment")
    .$type<{ id: string; name: string; price: string; description: string; image?: string; category?: "lighting" | "sound" }[]>()
    .notNull()
    .default([]),
  avatarPath: text("avatar_path"),
  bannerPath: text("banner_path"),
  reviewStatus: text("review_status").notNull().default("nieuw"),
  reviewMessage: text("review_message"),
  reviewData: jsonb("review_data")
    .$type<{
      checklist?: Record<string, boolean>
      notes?: { id: string; author: string; date: string; text: string }[]
      timeline?: {
        id: string
        type: string
        date: string
        title: string
        description?: string
        author: string
        missing?: string[]
        reason?: string
        message?: string
      }[]
      /** What the professional still has to add: keys of MISSING_POINTS in lib/review-points. */
      missing?: string[]
    }>()
    .notNull()
    .default({}),
  reviewerName: text("reviewer_name"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const VAT_SCHEMES = ["standard", "kor"] as const
export type VatScheme = (typeof VAT_SCHEMES)[number]

export const billingProfiles = pgTable("billing_profiles", {
  professionalId: text("professional_id").primaryKey(),
  businessName: text("business_name").notNull().default(""),
  kvkNumber: text("kvk_number"),
  vatNumber: text("vat_number"),
  vatScheme: text("vat_scheme").$type<VatScheme>().notNull().default("standard"),
  performanceVatRate: integer("performance_vat_rate").notNull().default(9),
  iban: text("iban"),
  street: text("street"),
  houseNumber: text("house_number"),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country").notNull().default("Nederland"),
  invoicePrefix: text("invoice_prefix").notNull().default(""),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  selfBillingAcceptedAt: timestamp("self_billing_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type BillingProfile = typeof billingProfiles.$inferSelect

export const INVOICE_METHODS = ["self_billing", "upload"] as const
export type InvoiceMethod = (typeof INVOICE_METHODS)[number]

export const INVOICE_STATUSES = ["submitted", "approved", "rejected"] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export type InvoiceLineKey = "performance" | "equipment" | "travel" | "parking" | "extra"

/** One invoice row, snapshotted at submission so later rate changes never alter an issued invoice. */
export interface InvoiceLine {
  key: InvoiceLineKey
  description: string
  quantity: number
  unitLabel: string
  unitCents: number
  vatRate: number
  grossCents: number
  vatCents: number
  netCents: number
  receipt?: { pathname: string; name: string; size: number; contentType: string }
}

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  professionalId: text("professional_id").notNull(),
  method: text("method").$type<InvoiceMethod>().notNull().default("self_billing"),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  lines: jsonb("lines").$type<InvoiceLine[]>().notNull().default([]),
  netCents: integer("net_cents").notNull().default(0),
  vatCents: integer("vat_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  declaredTotalCents: integer("declared_total_cents"),
  filePathname: text("file_pathname"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileContentType: text("file_content_type"),
  status: text("status").$type<InvoiceStatus>().notNull().default("submitted"),
  note: text("note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Invoice = typeof invoices.$inferSelect

export const customerProfiles = pgTable("customer_profiles", {
  userId: text("user_id").primaryKey(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  customerType: text("customer_type").$type<"private" | "business">().notNull().default("private"),
  companyName: text("company_name").notNull().default(""),
  billingStreet: text("billing_street").notNull().default(""),
  billingHouseNumber: text("billing_house_number").notNull().default(""),
  billingPostalCode: text("billing_postal_code").notNull().default(""),
  billingCity: text("billing_city").notNull().default(""),
  billingCountry: text("billing_country").notNull().default("Nederland"),
  vatNumber: text("vat_number").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const customerFavorites = pgTable("customer_favorites", {
  userId: text("user_id").notNull(),
  professionalId: text("professional_id").notNull(),
  professionalType: text("professional_type").$type<"artist" | "photographer">().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.professionalId, table.professionalType] })])

/** One thread per customer and professional; a null professional means the ARSI support thread. */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  professionalId: text("professional_id"),
  customerLastReadAt: timestamp("customer_last_read_at", { withTimezone: true }).notNull().defaultNow(),
  staffLastReadAt: timestamp("staff_last_read_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type MessageRole = "customer" | "professional" | "admin"

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").$type<MessageRole>().notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  professionalId: text("professional_id").notNull(),
  professionalType: text("professional_type").notNull(),
  token: text("token").notNull().unique(),
  rating: integer("rating"),
  comment: text("comment"),
  reply: text("reply"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const customerNotifications = pgTable("customer_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  status: text("status").$type<BookingStatus>().notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
