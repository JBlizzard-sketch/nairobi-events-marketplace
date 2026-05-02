import {
  pgTable,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  uuid,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "planner",
  "vendor",
  "admin",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "corporate",
  "wedding",
  "birthday",
  "product_launch",
  "conference",
  "private_party",
  "other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "brief_submitted",
  "quotes_requested",
  "quotes_received",
  "vendor_selected",
  "booked",
  "completed",
  "cancelled",
]);

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "catering",
  "mc",
  "photography",
  "videography",
  "floristry",
  "av_technical",
  "tent_furniture",
  "security",
  "entertainment",
  "decor",
  "transportation",
  "other",
]);

export const vendorStatusEnum = pgEnum("vendor_status", [
  "pending_review",
  "approved",
  "suspended",
  "rejected",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "requested",
  "submitted",
  "revision_requested",
  "accepted",
  "rejected",
  "expired",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_escrow",
  "completed",
  "disputed",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "held_in_escrow",
  "released",
  "refunded",
  "failed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "quote_requested",
  "quote_received",
  "booking_confirmed",
  "payment_received",
  "payment_released",
  "review_reminder",
  "event_reminder",
  "vendor_suspended",
  "system",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("planner"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Vendor Profiles ──────────────────────────────────────────────────────────

export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull(),
    category: vendorCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    status: vendorStatusEnum("status").notNull().default("pending_review"),
    kraPin: text("kra_pin"),
    businessRegNumber: text("business_reg_number"),
    portfolioUrls: jsonb("portfolio_urls")
      .$type<string[]>()
      .default([]),
    referenceContacts: jsonb("reference_contacts")
      .$type<{ name: string; phone: string; relationship: string }[]>()
      .default([]),
    adminNotes: text("admin_notes"),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
    totalReviews: integer("total_reviews").notNull().default(0),
    totalBookings: integer("total_bookings").notNull().default(0),
    noShowCount: integer("no_show_count").notNull().default(0),
    isPremium: boolean("is_premium").notNull().default(false),
    premiumExpiresAt: timestamp("premium_expires_at"),
    city: text("city").notNull().default("Nairobi"),
    serviceAreas: jsonb("service_areas").$type<string[]>().default([]),
    websiteUrl: text("website_url"),
    instagramHandle: text("instagram_handle"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("vendor_category_idx").on(t.category),
    index("vendor_status_idx").on(t.status),
  ],
);

export const insertVendorProfileSchema = createInsertSchema(vendorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  averageRating: true,
  totalReviews: true,
  totalBookings: true,
  noShowCount: true,
  status: true,
});
export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type NewVendorProfile = typeof vendorProfiles.$inferInsert;

// ─── Vendor Availability ──────────────────────────────────────────────────────

export const vendorAvailability = pgTable(
  "vendor_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("vendor_avail_date_idx").on(t.vendorId, t.date)],
);

export type VendorAvailability = typeof vendorAvailability.$inferSelect;

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    plannerId: uuid("planner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    eventType: eventTypeEnum("event_type").notNull(),
    status: eventStatusEnum("status").notNull().default("draft"),
    eventDate: date("event_date").notNull(),
    eventEndDate: date("event_end_date"),
    venue: text("venue"),
    city: text("city").notNull().default("Nairobi"),
    guestCount: integer("guest_count").notNull(),
    budgetMin: decimal("budget_min", { precision: 12, scale: 2 }),
    budgetMax: decimal("budget_max", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("KES"),
    servicesNeeded: jsonb("services_needed")
      .$type<string[]>()
      .notNull()
      .default([]),
    specialRequirements: text("special_requirements"),
    isEmergency: boolean("is_emergency").notNull().default(false),
    quotesDeadline: timestamp("quotes_deadline"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("event_planner_idx").on(t.plannerId),
    index("event_status_idx").on(t.status),
    index("event_date_idx").on(t.eventDate),
  ],
);

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  quotesDeadline: true,
});
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ─── Quote Requests ───────────────────────────────────────────────────────────

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    category: vendorCategoryEnum("category").notNull(),
    status: quoteStatusEnum("status").notNull().default("requested"),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    vendorViewedAt: timestamp("vendor_viewed_at"),
  },
  (t) => [
    index("qr_event_idx").on(t.eventId),
    index("qr_vendor_idx").on(t.vendorId),
  ],
);

export type QuoteRequest = typeof quoteRequests.$inferSelect;

// ─── Quotes ───────────────────────────────────────────────────────────────────

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteRequestId: uuid("quote_request_id")
      .notNull()
      .references(() => quoteRequests.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    category: vendorCategoryEnum("category").notNull(),
    status: quoteStatusEnum("status").notNull().default("submitted"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("KES"),
    depositPercent: integer("deposit_percent").default(30),
    lineItems: jsonb("line_items")
      .$type<
        { description: string; quantity: number; unitPrice: number; total: number }[]
      >()
      .notNull()
      .default([]),
    inclusions: jsonb("inclusions").$type<string[]>().default([]),
    exclusions: jsonb("exclusions").$type<string[]>().default([]),
    terms: text("terms"),
    validUntil: timestamp("valid_until"),
    notes: text("notes"),
    version: integer("version").notNull().default(1),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("quote_event_idx").on(t.eventId),
    index("quote_vendor_idx").on(t.vendorId),
  ],
);

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
  version: true,
  status: true,
});
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "restrict" }),
    plannerId: uuid("planner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: bookingStatusEnum("status").notNull().default("pending"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    platformFeeAmount: decimal("platform_fee_amount", { precision: 12, scale: 2 }).notNull(),
    vendorPayoutAmount: decimal("vendor_payout_amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("KES"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    contractUrl: text("contract_url"),
    confirmedAt: timestamp("confirmed_at"),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("booking_event_idx").on(t.eventId),
    index("booking_vendor_idx").on(t.vendorId),
    index("booking_planner_idx").on(t.plannerId),
  ],
);

export type Booking = typeof bookings.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KES"),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeChargeId: text("stripe_charge_id"),
  escrowReleasedAt: timestamp("escrow_released_at"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    qualityRating: integer("quality_rating"),
    punctualityRating: integer("punctuality_rating"),
    valueRating: integer("value_rating"),
    comment: text("comment"),
    isNoShow: boolean("is_no_show").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(true),
    vendorReply: text("vendor_reply"),
    vendorRepliedAt: timestamp("vendor_replied_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("review_vendor_idx").on(t.vendorId)],
);

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  vendorReply: true,
  vendorRepliedAt: true,
});
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notif_user_idx").on(t.userId),
    index("notif_read_idx").on(t.isRead),
  ],
);

export type Notification = typeof notifications.$inferSelect;
