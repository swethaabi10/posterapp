import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / local auth ID
  email: text('email').notNull(),
  password: text('password').default(''),
  name: text('name').notNull(),
  role: text('role').default('user'),
  shopName: text('shop_name').default(''),
  ownerName: text('owner_name').default(''),
  shopAddress: text('shop_address').default(''),
  shopPhone: text('shop_phone').default(''),
  whatsappNumber: text('whatsapp_number').default(''),
  logoUrl: text('logo_url').default(''),
  paymentStatus: text('payment_status').default('approved'),
  paymentTxnId: text('payment_txn_id').default(''),
  paymentDate: timestamp('payment_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  templateId: text('template_id').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull().default('daily'),
  layoutType: text('layout_type').notNull().default('fullBleed'),
  bgGradient: text('bg_gradient').default('#1a1a2e'),
  primaryColor: text('primary_color').default('#d4a017'),
  secondaryColor: text('secondary_color').default('#ffffff'),
  backgroundImageUrl: text('background_image_url').default(''),
  defaultGoldRate22k: integer('default_gold_rate_22k').default(6600),
  defaultGoldRate24k: integer('default_gold_rate_24k').default(7200),
  defaultGoldRate18k: integer('default_gold_rate_18k').default(5400),
  defaultSilverRate: integer('default_silver_rate').default(85),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posters = pgTable('posters', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').references(() => users.uid).notNull(),
  templateId: text('template_id').default(''),
  imageUrlOrData: text('image_url_or_data').notNull(),
  goldRate22k: integer('gold_rate_22k').notNull().default(0),
  goldRate24k: integer('gold_rate_24k').notNull().default(0),
  goldRate18k: integer('gold_rate_18k').notNull().default(0),
  silverRate: integer('silver_rate').notNull().default(0),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').references(() => users.uid).notNull(),
  templateId: text('template_id').notNull(),
  action: text('action').notNull(), // 'save' | 'share'
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posters: many(posters),
  activities: many(userActivities),
}));

export const postersRelations = relations(posters, ({ one }) => ({
  user: one(users, {
    fields: [posters.userUid],
    references: [users.uid],
  }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userUid],
    references: [users.uid],
  }),
}));
