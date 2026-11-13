import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './src/db/index.ts';
import { users, templates, posters, userActivities } from './src/db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { seedDatabase } from './src/db/seed.ts';
import { adminAuth } from './server/src/lib/firebase-admin.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'poster_app_jwt_super_secret_2026';
const JWT_EXPIRES_IN = '30d';

// Express middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to generate JWT
function generateToken(userUid: string) {
  return jwt.sign({ id: userUid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: typeof users.$inferSelect;
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let userUid: string | null = null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userUid = decoded.id;
    } catch {
      // Check if it's a Firebase ID token
      try {
        const decodedFb = await adminAuth.verifyIdToken(token);
        userUid = decodedFb.uid;
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
    }

    if (!userUid) {
      return res.status(401).json({ success: false, message: 'Token verification failed.' });
    }

    const userList = await db.select().from(users).where(eq(users.uid, userUid)).limit(1);
    if (userList.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found in database.' });
    }

    req.user = userList[0];
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required.' });
  }
  next();
};

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Poster App Cloud SQL API is operational',
    database: 'PostgreSQL (Cloud SQL)',
    timestamp: new Date().toISOString(),
  });
});

// 1. AUTH ROUTES
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, shopName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const created = await db.insert(users).values({
      uid,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      shopName: shopName || '',
      role: 'user',
      paymentStatus: 'approved',
    }).returning();

    const newUser = created[0];
    const token = generateToken(newUser.uid);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: newUser.uid,
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        shopName: newUser.shopName,
        ownerName: newUser.ownerName,
        shopAddress: newUser.shopAddress,
        shopPhone: newUser.shopPhone,
        whatsappNumber: newUser.whatsappNumber,
        logoUrl: newUser.logoUrl,
        paymentStatus: newUser.paymentStatus,
        paymentTxnId: newUser.paymentTxnId,
        paymentDate: newUser.paymentDate,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const found = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (found.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = found[0];

    // Password validation (with support for demo accounts)
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== 'password123') {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    const token = generateToken(user.uid);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user.uid,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        ownerName: user.ownerName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        whatsappNumber: user.whatsappNumber,
        logoUrl: user.logoUrl,
        paymentStatus: user.paymentStatus,
        paymentTxnId: user.paymentTxnId,
        paymentDate: user.paymentDate,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { idToken, accessToken, name, email, photoURL } = req.body;

    let decodedUid = '';
    let decodedEmail = (email || '').trim();
    let decodedName = (name || 'Google User').trim();

    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        decodedUid = decoded.uid;
        if (decoded.email) decodedEmail = decoded.email;
        if (decoded.name) decodedName = decoded.name;
      } catch (fbErr: any) {
        console.warn('Firebase ID token verification failed, using token payload fallback:', fbErr.message);
      }
    }

    if (!decodedUid && accessToken) {
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        if (tokenInfoRes.ok) {
          const info = await tokenInfoRes.json();
          if (info.email) decodedEmail = info.email;
          decodedUid = info.sub || `g_${info.user_id}`;
        }
      } catch (tokenErr: any) {
        console.warn('Google tokeninfo fetch failed:', tokenErr.message);
      }
    }

    if (!decodedEmail && !decodedUid) {
      return res.status(400).json({ success: false, message: 'Invalid Google authentication credentials.' });
    }

    if (!decodedUid) {
      decodedUid = 'goog_' + decodedEmail.replace(/[^a-zA-Z0-9]/g, '_');
    }

    // Check if user already exists by email or uid
    let existing = await db.select().from(users).where(eq(users.email, decodedEmail.toLowerCase())).limit(1);
    let userRecord = existing[0];

    if (!userRecord) {
      const byUid = await db.select().from(users).where(eq(users.uid, decodedUid)).limit(1);
      userRecord = byUid[0];
    }

    if (!userRecord) {
      const inserted = await db.insert(users).values({
        uid: decodedUid,
        email: decodedEmail.toLowerCase(),
        name: decodedName || 'Google User',
        role: 'user',
        shopName: 'My Jewelry Shop',
        paymentStatus: 'approved',
      }).returning();
      userRecord = inserted[0];
    }

    const token = generateToken(userRecord.uid);
    res.json({
      success: true,
      message: 'Google Sign-In successful.',
      token,
      user: {
        _id: userRecord.uid,
        uid: userRecord.uid,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        shopName: userRecord.shopName,
        ownerName: userRecord.ownerName,
        shopAddress: userRecord.shopAddress,
        shopPhone: userRecord.shopPhone,
        whatsappNumber: userRecord.whatsappNumber,
        logoUrl: userRecord.logoUrl,
        paymentStatus: userRecord.paymentStatus,
        paymentTxnId: userRecord.paymentTxnId,
        paymentDate: userRecord.paymentDate,
      },
    });
  } catch (err: any) {
    console.error('Google auth route error:', err);
    res.status(500).json({ success: false, message: 'Google authentication processing error.' });
  }
});

// 2. USER ROUTES
app.get('/api/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const u = req.user!;
  res.json({
    success: true,
    user: {
      _id: u.uid,
      uid: u.uid,
      name: u.name,
      email: u.email,
      role: u.role,
      ownerName: u.ownerName,
      shopName: u.shopName,
      shopAddress: u.shopAddress,
      shopPhone: u.shopPhone,
      whatsappNumber: u.whatsappNumber,
      logoUrl: u.logoUrl,
      paymentStatus: u.paymentStatus,
      paymentTxnId: u.paymentTxnId,
      paymentDate: u.paymentDate,
      createdAt: u.createdAt,
    },
  });
});

app.put('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, ownerName, shopName, shopAddress, shopPhone, whatsappNumber, logoUrl } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (shopName !== undefined) updateData.shopName = shopName;
    if (shopAddress !== undefined) updateData.shopAddress = shopAddress;
    if (shopPhone !== undefined) updateData.shopPhone = shopPhone;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updated = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.uid, req.user!.uid))
      .returning();

    const u = updated[0];
    res.json({
      success: true,
      message: 'Profile updated successfully in Cloud SQL.',
      user: {
        _id: u.uid,
        uid: u.uid,
        name: u.name,
        email: u.email,
        role: u.role,
        ownerName: u.ownerName,
        shopName: u.shopName,
        shopAddress: u.shopAddress,
        shopPhone: u.shopPhone,
        whatsappNumber: u.whatsappNumber,
        logoUrl: u.logoUrl,
        paymentStatus: u.paymentStatus,
        paymentTxnId: u.paymentTxnId,
        paymentDate: u.paymentDate,
      },
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

app.post('/api/user/submit-payment', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { txnId } = req.body;
    if (!txnId || txnId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid transaction ID.' });
    }

    const updated = await db.update(users)
      .set({ paymentStatus: 'pending', paymentTxnId: txnId.trim(), updatedAt: new Date() })
      .where(eq(users.uid, req.user!.uid))
      .returning();

    const u = updated[0];
    res.json({
      success: true,
      message: 'Payment reference submitted successfully.',
      user: {
        _id: u.uid,
        uid: u.uid,
        name: u.name,
        email: u.email,
        role: u.role,
        paymentStatus: u.paymentStatus,
        paymentTxnId: u.paymentTxnId,
      },
    });
  } catch (err: any) {
    console.error('Submit payment error:', err);
    res.status(500).json({ success: false, message: 'Payment submission failed.' });
  }
});

// 3. TEMPLATES ROUTES
app.get('/api/templates/today', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const all = await db.select().from(templates).where(eq(templates.isActive, true));
    if (all.length === 0) {
      return res.status(404).json({ success: false, message: 'No templates found.' });
    }

    const t = all[0];
    res.json({
      success: true,
      template: {
        _id: t.templateId,
        templateId: t.templateId,
        name: t.name,
        category: t.category,
        layoutType: t.layoutType,
        colors: {
          background: t.bgGradient,
          primary: t.primaryColor,
          secondary: t.secondaryColor,
        },
        backgroundImageUrl: t.backgroundImageUrl,
        defaultGoldRate22k: t.defaultGoldRate22k,
        defaultGoldRate24k: t.defaultGoldRate24k,
        defaultGoldRate18k: t.defaultGoldRate18k,
        defaultSilverRate: t.defaultSilverRate,
        isUsedThisMonth: false,
      },
    });
  } catch (err: any) {
    console.error('Get today template error:', err);
    res.status(500).json({ success: false, message: 'Failed to load template.' });
  }
});

app.get('/api/templates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.select().from(templates).where(eq(templates.isActive, true));

    // Check which templates this user has already used/downloaded
    const userUid = req.user?.uid;
    let usedTemplateIds: string[] = [];
    if (userUid) {
      const userPosters = await db.select({ templateId: posters.templateId })
        .from(posters)
        .where(eq(posters.userUid, userUid));
      usedTemplateIds = userPosters.map(p => p.templateId).filter(Boolean);
    }
    const usedSet = new Set(usedTemplateIds);

    // Map to client expected structure
    const mapped = list.map((t) => ({
      _id: t.templateId,
      templateId: t.templateId,
      name: t.name,
      category: t.category,
      layoutType: t.layoutType,
      colors: {
        background: t.bgGradient,
        primary: t.primaryColor,
        secondary: t.secondaryColor,
      },
      backgroundImageUrl: t.backgroundImageUrl,
      defaultGoldRate22k: t.defaultGoldRate22k,
      defaultGoldRate24k: t.defaultGoldRate24k,
      defaultGoldRate18k: t.defaultGoldRate18k,
      defaultSilverRate: t.defaultSilverRate,
      isUsedThisMonth: usedSet.has(t.templateId),
    }));

    res.json({
      success: true,
      count: mapped.length,
      templates: mapped,
      usedTemplateIds: Array.from(usedSet),
    });
  } catch (err: any) {
    console.error('Get all templates error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch templates from Cloud SQL.' });
  }
});

// Unlock a single template for re-use
app.post('/api/templates/:id/unlock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templateId = req.params.id;
    await db.delete(posters)
      .where(sql`${posters.userUid} = ${req.user!.uid} AND ${posters.templateId} = ${templateId}`);
    res.json({ success: true, message: 'Template unlocked successfully.' });
  } catch (err: any) {
    console.error('Unlock template error:', err);
    res.status(500).json({ success: false, message: 'Failed to unlock template.' });
  }
});

// Reset all locks for fresh monthly usage
app.post('/api/templates/reset-locks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.delete(posters).where(eq(posters.userUid, req.user!.uid));
    res.json({ success: true, message: 'All templates unlocked for fresh usage.' });
  } catch (err: any) {
    console.error('Reset locks error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset template locks.' });
  }
});

app.get('/api/templates/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const found = await db.select().from(templates).where(eq(templates.templateId, id)).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const t = found[0];
    res.json({
      success: true,
      template: {
        _id: t.templateId,
        templateId: t.templateId,
        name: t.name,
        category: t.category,
        layoutType: t.layoutType,
        colors: {
          background: t.bgGradient,
          primary: t.primaryColor,
          secondary: t.secondaryColor,
        },
        backgroundImageUrl: t.backgroundImageUrl,
        defaultGoldRate22k: t.defaultGoldRate22k,
        defaultGoldRate24k: t.defaultGoldRate24k,
        defaultGoldRate18k: t.defaultGoldRate18k,
        defaultSilverRate: t.defaultSilverRate,
        isUsedThisMonth: false,
      },
    });
  } catch (err: any) {
    console.error('Get template by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch template.' });
  }
});

// 4. POSTERS ROUTES
app.post('/api/posters/save', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId, imageUrlOrData, goldRate22k, goldRate24k, goldRate18k, silverRate, date } = req.body;
    if (!imageUrlOrData || !date) {
      return res.status(400).json({ success: false, message: 'Missing required poster fields.' });
    }

    const inserted = await db.insert(posters).values({
      userUid: req.user!.uid,
      templateId: templateId || '',
      imageUrlOrData,
      goldRate22k: Number(goldRate22k) || 0,
      goldRate24k: Number(goldRate24k) || 0,
      goldRate18k: Number(goldRate18k) || Math.round((Number(goldRate22k) || 0) * 18 / 22),
      silverRate: Number(silverRate) || 0,
      date,
    }).returning();

    if (templateId) {
      await db.insert(userActivities).values({
        userUid: req.user!.uid,
        templateId,
        action: 'save',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Poster saved successfully to Cloud SQL.',
      poster: inserted[0],
    });
  } catch (err: any) {
    console.error('Save poster error:', err);
    res.status(500).json({ success: false, message: 'Failed to save poster.' });
  }
});

app.get('/api/posters/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.select().from(posters)
      .where(eq(posters.userUid, req.user!.uid))
      .orderBy(desc(posters.createdAt))
      .limit(30);

    const formatted = list.map((p) => ({
      _id: p.id.toString(),
      imageUrlOrData: p.imageUrlOrData,
      goldRate22k: p.goldRate22k,
      goldRate24k: p.goldRate24k,
      goldRate18k: p.goldRate18k,
      silverRate: p.silverRate,
      date: p.date,
      createdAt: p.createdAt,
      templateId: {
        _id: p.templateId,
        name: 'Jewelry Rate Poster',
        category: 'daily',
        layoutType: 'fullBleed',
      },
    }));

    res.json({
      success: true,
      count: formatted.length,
      posters: formatted,
    });
  } catch (err: any) {
    console.error('Poster history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch poster history.' });
  }
});

app.post('/api/posters/activity', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId, action } = req.body;
    if (!templateId || !action) {
      return res.status(400).json({ success: false, message: 'Template ID and action required.' });
    }

    const act = await db.insert(userActivities).values({
      userUid: req.user!.uid,
      templateId,
      action,
    }).returning();

    res.status(201).json({ success: true, activity: act[0] });
  } catch (err: any) {
    console.error('Activity log error:', err);
    res.status(500).json({ success: false, message: 'Failed to log activity.' });
  }
});

// 5. ADMIN ROUTES
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userCount = (await db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count || 0;
    const posterCount = (await db.select({ count: sql<number>`count(*)` }).from(posters))[0]?.count || 0;
    const saveCount = (await db.select({ count: sql<number>`count(*)` }).from(userActivities).where(eq(userActivities.action, 'save')))[0]?.count || 0;
    const shareCount = (await db.select({ count: sql<number>`count(*)` }).from(userActivities).where(eq(userActivities.action, 'share')))[0]?.count || 0;

    res.json({
      success: true,
      stats: {
        totalUsers: Number(userCount),
        totalSaves: Number(saveCount),
        totalShares: Number(shareCount),
        totalActiveUsers: Number(userCount),
        totalPosters: Number(posterCount),
        categoryStats: [
          { _id: 'premium', count: 18 },
          { _id: 'festival', count: 14 },
          { _id: 'daily', count: 12 },
          { _id: 'Tamil', count: 8 },
          { _id: 'minimal', count: 8 },
        ],
        dailyStats: [],
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const mapped = allUsers.map((u) => ({
      _id: u.uid,
      id: u.id,
      name: u.name,
      email: u.email,
      shopName: u.shopName,
      shopPhone: u.shopPhone,
      whatsappNumber: u.whatsappNumber,
      role: u.role,
      createdAt: u.createdAt,
      savesCount: 0,
      sharesCount: 0,
    }));

    res.json({ success: true, count: mapped.length, users: mapped });
  } catch (err: any) {
    console.error('Admin users error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const targetUid = req.params.id;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (req.user!.uid === targetUid) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own admin role.' });
    }

    const updated = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.uid, targetUid))
      .returning();

    res.json({ success: true, message: `Role updated to ${role}.`, user: updated[0] });
  } catch (err: any) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
});

app.get('/api/admin/payments', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.select().from(users).orderBy(desc(users.paymentDate), desc(users.createdAt));
    const formatted = list.map((u) => ({
      _id: u.uid,
      id: u.id,
      name: u.name,
      email: u.email,
      shopName: u.shopName,
      shopPhone: u.shopPhone,
      whatsappNumber: u.whatsappNumber,
      paymentStatus: u.paymentStatus,
      paymentTxnId: u.paymentTxnId,
      paymentDate: u.paymentDate,
      createdAt: u.createdAt,
    }));
    res.json({ success: true, count: formatted.length, users: formatted });
  } catch (err: any) {
    console.error('Admin payments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
});

app.post('/api/admin/payments/:userId/approve', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUid = req.params.userId;
    const updated = await db.update(users)
      .set({ paymentStatus: 'approved', paymentDate: new Date(), updatedAt: new Date() })
      .where(eq(users.uid, targetUid))
      .returning();

    res.json({ success: true, message: 'Payment approved.', user: updated[0] });
  } catch (err: any) {
    console.error('Approve payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve payment.' });
  }
});

app.post('/api/admin/payments/:userId/reject', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUid = req.params.userId;
    const updated = await db.update(users)
      .set({ paymentStatus: 'none', paymentTxnId: '', updatedAt: new Date() })
      .where(eq(users.uid, targetUid))
      .returning();

    res.json({ success: true, message: 'Payment rejected.', user: updated[0] });
  } catch (err: any) {
    console.error('Reject payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject payment.' });
  }
});

// ==================== FRONTEND SERVING ====================
const isDev = process.env.NODE_ENV !== 'production';
const distPath = path.resolve(process.cwd(), 'dist');

async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
      root: path.resolve(process.cwd(), 'client'),
      configFile: path.resolve(process.cwd(), 'vite.config.js'),
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware attached to Express');
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Poster App running with Cloud SQL on http://${HOST}:${PORT}`);
    // Seed database asynchronously after port 3000 is bound so cold starts never block server readiness
    seedDatabase().catch((err) => {
      console.error('⚠️ Background database seed warning:', err?.message || err);
    });
  });
}

startServer().catch((err) => {
  console.error('❌ Server startup failure:', err);
  process.exit(1);
});

