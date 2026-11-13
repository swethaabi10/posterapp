import { db } from './index.ts';
import { users, templates } from './schema.ts';
import fs from 'fs';
import path from 'path';

// High-resolution curated jewelry backgrounds
const highResJewelryImages = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80', // Royal Gold Necklace
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80', // Diamond Solitaire & Ring
  'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1200&q=80', // Traditional Gold Bangles
  'https://images.unsplash.com/photo-1611591475871-344426543b35?auto=format&fit=crop&w=1200&q=80', // Emerald & Diamond Jewels
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80', // Fine Pearl & Silver Choker
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80', // Sparkling Diamond Band
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=80', // Ruby Gold Necklace
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=80', // Polki Indian Bridal Sets
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80', // Festive Gold Marigold
  'https://images.unsplash.com/photo-1543290954-51e4438fa741?auto=format&fit=crop&w=1200&q=80', // Vintage Antique Gold
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80', // Minimal Silver Jewels
  'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80', // Gold Chains & Coins
];

// Local premium assets
const localAssets = [
  '/images/gold_bg_1.png',
  '/images/gold_bg_2.png',
  '/images/gold_bg_3.png',
  '/images/gold_bg_4.png',
  '/images/diamond_bg_1.png',
  '/images/diamond_bg_2.png',
  '/images/diamond_bg_3.png',
  '/images/diamond_bg_4.png',
  '/images/silver_bg_1.png',
  '/images/silver_bg_2.png',
  '/images/silver_bg_3.png',
  '/images/silver_bg_4.png',
  '/images/diwali_bg_1.png',
  '/images/diwali_bg_2.png',
  '/images/diwali_bg_3.png',
  '/images/pongal_bg_1.png',
  '/images/pongal_bg_2.png',
  '/images/pongal_bg_3.png',
  '/images/pongal_bg_4.png',
  '/images/christmas_bg_1.png',
  '/images/christmas_bg_2.png',
];

export async function seedDatabase() {
  try {
    console.log('🌱 Checking Cloud SQL database seed state...');

    // 1. Seed Default Admin & Demo Users
    await db.insert(users).values([
      {
        uid: 'admin_uid_central_2026',
        email: 'admin@goldshop.com',
        name: 'System Admin',
        role: 'admin',
        shopName: 'Admin Central',
        ownerName: 'Admin Team',
        shopAddress: 'Jewelry Exchange, High Street',
        shopPhone: '+91 99999 99999',
        whatsappNumber: '+919999999999',
        paymentStatus: 'approved',
        paymentTxnId: 'SYS_ADMIN',
      },
      {
        uid: 'demo_uid_jeweler_2026',
        email: 'demo@goldshop.com',
        name: 'Demo Jeweler',
        role: 'user',
        shopName: 'Sri Lakshmi Jewelers',
        ownerName: 'Ashwin Kumar',
        shopAddress: '124 Gold Bazaar, MG Road',
        shopPhone: '+91 98765 43210',
        whatsappNumber: '+919876543210',
        paymentStatus: 'approved',
        paymentTxnId: 'DEMO_SUB_123',
      },
    ]).onConflictDoNothing();

    // 2. Check if templates are seeded
    const existingTemplates = await db.select().from(templates).limit(5);
    if (existingTemplates.length > 0) {
      console.log(`ℹ️ Cloud SQL already contains seeded templates.`);
      return;
    }

    // Build curated templates with high-res, unique imagery
    const curatedTemplates = [
      {
        templateId: 'tpl_gold_royal_navy',
        name: 'Royal Navy Gold Heritage',
        category: 'premium',
        layoutType: 'fullBleed',
        bgGradient: '#0a1628',
        primaryColor: '#e8b923',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[0],
        defaultGoldRate22k: 6600,
        defaultGoldRate24k: 7200,
        defaultGoldRate18k: 5400,
        defaultSilverRate: 85,
      },
      {
        templateId: 'tpl_diamond_emerald_split',
        name: 'Emerald Crown Luxury',
        category: 'premium',
        layoutType: 'splitTopBottom',
        bgGradient: '#052214',
        primaryColor: '#10b981',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[3],
        defaultGoldRate22k: 6650,
        defaultGoldRate24k: 7250,
        defaultGoldRate18k: 5440,
        defaultSilverRate: 86,
      },
      {
        templateId: 'tpl_ruby_crimson_left',
        name: 'Ruby Crimson Royal Crest',
        category: 'premium',
        layoutType: 'imageLeft',
        bgGradient: '#2b050c',
        primaryColor: '#f43f5e',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[6],
        defaultGoldRate22k: 6700,
        defaultGoldRate24k: 7300,
        defaultGoldRate18k: 5480,
        defaultSilverRate: 88,
      },
      {
        templateId: 'tpl_diamond_solitaire_right',
        name: 'Solitaire Diamond Sparkle',
        category: 'minimal',
        layoutType: 'imageRight',
        bgGradient: '#121212',
        primaryColor: '#e2e8f0',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[1],
        defaultGoldRate22k: 6580,
        defaultGoldRate24k: 7180,
        defaultGoldRate18k: 5384,
        defaultSilverRate: 84,
      },
      {
        templateId: 'tpl_bangles_temple_gold',
        name: 'Traditional Temple Bangles',
        category: 'festival',
        layoutType: 'fullBleed',
        bgGradient: '#241d0b',
        primaryColor: '#fbbf24',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[2],
        defaultGoldRate22k: 6680,
        defaultGoldRate24k: 7280,
        defaultGoldRate18k: 5465,
        defaultSilverRate: 88,
      },
      {
        templateId: 'tpl_silver_pearl_choker',
        name: 'Silver Pearl Minimalist',
        category: 'minimal',
        layoutType: 'splitTopBottom',
        bgGradient: '#1e293b',
        primaryColor: '#cbd5e1',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[4],
        defaultGoldRate22k: 6620,
        defaultGoldRate24k: 7220,
        defaultGoldRate18k: 5416,
        defaultSilverRate: 85,
      },
      {
        templateId: 'tpl_diwali_marigold_fest',
        name: 'Diwali Shubh Labh Marigold',
        category: 'Tamil',
        layoutType: 'imageLeft',
        bgGradient: '#381005',
        primaryColor: '#f59e0b',
        secondaryColor: '#ffffff',
        backgroundImageUrl: localAssets[12],
        defaultGoldRate22k: 6690,
        defaultGoldRate24k: 7290,
        defaultGoldRate18k: 5474,
        defaultSilverRate: 88,
      },
      {
        templateId: 'tpl_pongal_traditional_pot',
        name: 'Pongal Golden Harvest Card',
        category: 'Tamil',
        layoutType: 'imageRight',
        bgGradient: '#1c1409',
        primaryColor: '#eab308',
        secondaryColor: '#ffffff',
        backgroundImageUrl: localAssets[15],
        defaultGoldRate22k: 6640,
        defaultGoldRate24k: 7240,
        defaultGoldRate18k: 5433,
        defaultSilverRate: 86,
      },
      {
        templateId: 'tpl_bridal_polki_royal',
        name: 'Kundan Polki Bridal Special',
        category: 'wedding',
        layoutType: 'fullBleed',
        bgGradient: '#1f0208',
        primaryColor: '#fb7185',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[7],
        defaultGoldRate22k: 6720,
        defaultGoldRate24k: 7320,
        defaultGoldRate18k: 5498,
        defaultSilverRate: 89,
      },
      {
        templateId: 'tpl_antique_heritage_daily',
        name: 'Antique Vintage Daily Card',
        category: 'daily',
        layoutType: 'splitTopBottom',
        bgGradient: '#18110a',
        primaryColor: '#d97706',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[9],
        defaultGoldRate22k: 6610,
        defaultGoldRate24k: 7210,
        defaultGoldRate18k: 5408,
        defaultSilverRate: 85,
      },
      {
        templateId: 'tpl_english_gold_radiance',
        name: 'Modern Gold Bullion Rates',
        category: 'English',
        layoutType: 'imageLeft',
        bgGradient: '#0f172a',
        primaryColor: '#facc15',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[11],
        defaultGoldRate22k: 6630,
        defaultGoldRate24k: 7230,
        defaultGoldRate18k: 5425,
        defaultSilverRate: 86,
      },
      {
        templateId: 'tpl_wedding_celebration_banner',
        name: 'Grand Wedding Season Rate Card',
        category: 'wedding',
        layoutType: 'imageRight',
        bgGradient: '#290610',
        primaryColor: '#f43f5e',
        secondaryColor: '#ffffff',
        backgroundImageUrl: highResJewelryImages[5],
        defaultGoldRate22k: 6710,
        defaultGoldRate24k: 7310,
        defaultGoldRate18k: 5490,
        defaultSilverRate: 89,
      },
    ];

    // Read additional unique background images from dataset if present
    let rawUrls: string[] = [];
    try {
      const dataFile = path.resolve(process.cwd(), 'unique_jewelry_urls.json');
      if (fs.existsSync(dataFile)) {
        rawUrls = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      }
    } catch {
      // fallback
    }

    // Add 48 more diverse categorized templates to provide 60 optimal selections
    const categories = ['daily', 'festival', 'premium', 'minimal', 'Tamil', 'English', 'wedding', 'new-arrivals'];
    const layouts = ['fullBleed', 'splitTopBottom', 'imageLeft', 'imageRight'] as const;

    for (let i = 0; i < 48; i++) {
      const cat = categories[i % categories.length];
      const lay = layouts[i % layouts.length];
      const img = localAssets[i % localAssets.length] || highResJewelryImages[i % highResJewelryImages.length];
      const num = i + 13;
      const rate22 = 6600 + (i * 5);
      const rate24 = 7200 + (i * 5);

      curatedTemplates.push({
        templateId: `tpl_curated_${num}`,
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Jewelry Showcase No. ${num}`,
        category: cat,
        layoutType: lay,
        bgGradient: '#0a1628',
        primaryColor: '#e8b923',
        secondaryColor: '#ffffff',
        backgroundImageUrl: img,
        defaultGoldRate22k: rate22,
        defaultGoldRate24k: rate24,
        defaultGoldRate18k: Math.round(rate22 * 18 / 22),
        defaultSilverRate: 85 + (i % 5),
      });
    }

    console.log(`Seeding ${curatedTemplates.length} high-quality templates to Cloud SQL...`);
    await db.insert(templates).values(curatedTemplates).onConflictDoNothing();
    console.log('✅ Cloud SQL database seeded successfully!');
  } catch (err: any) {
    console.error('❌ Error seeding database:', err.message);
  }
}
