import { db } from './index.ts';
import { users, templates, posters, userActivities } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

// User queries
export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0] || null;
}

export async function findUserByUid(uid: string) {
  const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return result[0] || null;
}

export async function createUser(userData: {
  uid: string;
  email: string;
  password?: string;
  name: string;
  role?: string;
  shopName?: string;
  ownerName?: string;
  shopAddress?: string;
  shopPhone?: string;
  whatsappNumber?: string;
  logoUrl?: string;
  paymentStatus?: string;
  paymentTxnId?: string;
}) {
  const result = await db.insert(users).values({
    uid: userData.uid,
    email: userData.email.toLowerCase(),
    password: userData.password || '',
    name: userData.name,
    role: userData.role || 'user',
    shopName: userData.shopName || '',
    ownerName: userData.ownerName || '',
    shopAddress: userData.shopAddress || '',
    shopPhone: userData.shopPhone || '',
    whatsappNumber: userData.whatsappNumber || '',
    logoUrl: userData.logoUrl || '',
    paymentStatus: userData.paymentStatus || 'approved',
    paymentTxnId: userData.paymentTxnId || '',
  }).returning();
  return result[0];
}

export async function updateUserByUid(uid: string, fields: Partial<typeof users.$inferInsert>) {
  const result = await db.update(users)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(users.uid, uid))
    .returning();
  return result[0] || null;
}

export async function getAllUsers() {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// Template queries
export async function getAllActiveTemplates() {
  return await db.select().from(templates).where(eq(templates.isActive, true));
}

export async function getTemplateByTemplateId(templateId: string) {
  const result = await db.select().from(templates).where(eq(templates.templateId, templateId)).limit(1);
  return result[0] || null;
}

// Poster queries
export async function createPoster(posterData: {
  userUid: string;
  templateId?: string;
  imageUrlOrData: string;
  goldRate22k: number;
  goldRate24k: number;
  goldRate18k: number;
  silverRate: number;
  date: string;
}) {
  const result = await db.insert(posters).values(posterData).returning();
  return result[0];
}

export async function getUserPosterHistory(userUid: string, limitCount = 30) {
  return await db.select().from(posters)
    .where(eq(posters.userUid, userUid))
    .orderBy(desc(posters.createdAt))
    .limit(limitCount);
}

// Activity queries
export async function logUserActivity(userUid: string, templateId: string, action: string) {
  const result = await db.insert(userActivities).values({
    userUid,
    templateId,
    action,
  }).returning();
  return result[0];
}

export async function getActivityStats() {
  const totalUsers = (await db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count || 0;
  const totalPosters = (await db.select({ count: sql<number>`count(*)` }).from(posters))[0]?.count || 0;
  const totalSaves = (await db.select({ count: sql<number>`count(*)` }).from(userActivities).where(eq(userActivities.action, 'save')))[0]?.count || 0;
  const totalShares = (await db.select({ count: sql<number>`count(*)` }).from(userActivities).where(eq(userActivities.action, 'share')))[0]?.count || 0;

  return {
    totalUsers: Number(totalUsers),
    totalPosters: Number(totalPosters),
    totalSaves: Number(totalSaves),
    totalShares: Number(totalShares),
  };
}
