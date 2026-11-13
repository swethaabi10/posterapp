/**
 * Monthly Template Scraper & Festival Generator
 * Fully integrated with Google Cloud SQL / PostgreSQL (Drizzle ORM)
 * Automatically prepares and rotates fresh festival and luxury gold designs every month
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../src/db/schema.ts';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load environment variables
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 5,
  connectionTimeoutMillis: 15000,
});

const db = drizzle(pool, { schema });

// 12-Month Indian Jewelry Festival Calendar
export const MONTH_FESTIVALS: Record<number, {
  name: string;
  theme: string;
  query: string;
  primary: string;
  background: string;
  secondary: string;
}> = {
  0: {
    name: 'Pongal / Makar Sankranti Harvest Gold',
    theme: 'Pongal / Sankranti',
    query: 'traditional south indian gold necklace jewelry',
    primary: '#f59e0b',
    background: '#ffffff',
    secondary: '#111827',
  },
  1: {
    name: 'Maha Shivratri & Auspicious Rings',
    theme: 'Shivratri Special',
    query: 'luxury gold diamond wedding rings',
    primary: '#d4a017',
    background: '#fffbeb',
    secondary: '#0f172a',
  },
  2: {
    name: 'Ugadi & Holi Radiant Collection',
    theme: 'Ugadi / Holi Festival',
    query: 'traditional gold bangles jewelry indian',
    primary: '#e8b923',
    background: '#ffffff',
    secondary: '#111827',
  },
  3: {
    name: 'Akshaya Tritiya & Tamil New Year (Puthandu)',
    theme: 'Akshaya Tritiya Gold Fest',
    query: 'pure 24k gold bullion coin necklace',
    primary: '#f59e0b',
    background: '#fffdf5',
    secondary: '#0f172a',
  },
  4: {
    name: 'Grand Bridal & Wedding Jewels Showcase',
    theme: 'Bridal Heritage',
    query: 'indian bridal gold necklace jewellery',
    primary: '#e11d48',
    background: '#ffffff',
    secondary: '#111827',
  },
  5: {
    name: 'Antique Temple Bangles & Mangalsutra Fest',
    theme: 'Temple Heritage',
    query: 'antique gold jewellery bangles temple',
    primary: '#d4a017',
    background: '#fffbeb',
    secondary: '#0f172a',
  },
  6: {
    name: 'Royal Solitaire & Platinum Summer Elegance',
    theme: 'Platinum & Solitaire',
    query: 'diamond solitaire necklace jewelry luxury',
    primary: '#0ea5e9',
    background: '#ffffff',
    secondary: '#111827',
  },
  7: {
    name: 'Varalakshmi Vratham & Raksha Bandhan Special',
    theme: 'Varalakshmi Gold',
    query: 'traditional gold coin chain pooja jewelry',
    primary: '#f59e0b',
    background: '#fffdf5',
    secondary: '#0f172a',
  },
  8: {
    name: 'Onam & Ganesh Chaturthi Golden Auspicious',
    theme: 'Onam / Ganesha Fest',
    query: 'kerala kasavu traditional gold jewelry',
    primary: '#10b981',
    background: '#ffffff',
    secondary: '#111827',
  },
  9: {
    name: 'Navratri, Durga Puja & Dussehra Grand Shubh',
    theme: 'Navratri Shubh Labh',
    query: 'kundan polki royal gold necklace jewelry',
    primary: '#ef4444',
    background: '#fffdf5',
    secondary: '#0f172a',
  },
  10: {
    name: 'Dhanteras & Diwali Shubh Deepavali Mahotsav',
    theme: 'Dhanteras / Diwali Gold',
    query: 'diwali gold jewelry necklace lights',
    primary: '#f59e0b',
    background: '#ffffff',
    secondary: '#0f172a',
  },
  11: {
    name: 'Christmas & New Year Celebration Jewels',
    theme: 'Winter Celebrations',
    query: 'sparkling diamond gold jewelry gifts',
    primary: '#e11d48',
    background: '#ffffff',
    secondary: '#111827',
  },
};

// High-resolution curated jewelry assets
const CURATED_JEWELRY_IMAGES = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1611591475871-344426543b35?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85',
  'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=85',
];

const LOCAL_FALLBACKS = [
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
  '/images/pongal_bg_1.png',
  '/images/pongal_bg_2.png',
  '/images/diwali_bg_1.png',
  '/images/diwali_bg_2.png',
];

export async function runMonthlyScraper() {
  console.log('🚀 Starting Monthly Festival Template Scraper with Cloud SQL (PostgreSQL)...');

  const now = new Date();
  let targetMonth = now.getMonth();
  if (process.env.TEST_MONTH_INDEX !== undefined) {
    targetMonth = parseInt(process.env.TEST_MONTH_INDEX, 10);
  } else if (process.env.SEED_UPCOMING_MONTH === 'true' && now.getDate() >= 25) {
    targetMonth = (targetMonth + 1) % 12;
  }

  const festival = MONTH_FESTIVALS[targetMonth];
  const monthName = new Date(now.getFullYear(), targetMonth, 1).toLocaleString('en-IN', { month: 'long' });
  console.log(`📅 Target Month: ${monthName} | Active Celebration: ${festival.name}`);

  // Fetch optional Unsplash/Pixabay images if keys available
  let fetchedImages: string[] = [];
  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const res = await axios.get(
        `https://api.unsplash.com/search/photos?client_id=${process.env.UNSPLASH_ACCESS_KEY}&query=${encodeURIComponent(
          festival.query
        )}&per_page=30&orientation=squarish`
      );
      if (res.data?.results) {
        fetchedImages = res.data.results.map((r: any) => r.urls?.regular).filter(Boolean);
        console.log(`📸 Fetched ${fetchedImages.length} live images from Unsplash.`);
      }
    } catch (e: any) {
      console.warn('⚠️ Unsplash fetch skipped:', e.message);
    }
  }

  const allAvailableImages = [...fetchedImages, ...CURATED_JEWELRY_IMAGES, ...LOCAL_FALLBACKS];
  console.log(`✨ Total Image Pool for ${monthName}: ${allAvailableImages.length} designs.`);

  // Generate 60 high-definition monthly templates
  const layouts = ['fullBleed', 'splitTopBottom', 'imageLeft', 'imageRight'];
  const newTemplates = [];

  for (let i = 0; i < 60; i++) {
    const isFestive = i % 2 === 0;
    const imgUrl = allAvailableImages[i % allAvailableImages.length];
    const layout = layouts[i % layouts.length];
    const templateUid = `tmpl_${targetMonth + 1}_${String(i + 1).padStart(3, '0')}`;

    const metalType = i % 3 === 0 ? 'Gold' : i % 3 === 1 ? 'Diamond' : 'Silver';
    const title = isFestive
      ? `${festival.theme} - Royal ${metalType} Design ${i + 1}`
      : `Luxury ${metalType} Daily Rate Card #${i + 1}`;

    const default22k = 6800 + ((i * 7) % 200);
    const default24k = 7350 + ((i * 7) % 200);
    const default18k = Math.round((default22k * 18) / 22);
    const defaultSilver = 92 + (i % 6);

    newTemplates.push({
      templateId: templateUid,
      name: title,
      category: isFestive ? 'festival' : 'premium',
      layoutType: layout,
      bgGradient: isFestive ? festival.background : i % 2 === 0 ? '#ffffff' : '#fffbeb',
      primaryColor: isFestive ? festival.primary : '#d4a017',
      secondaryColor: isFestive ? festival.secondary : '#111827',
      backgroundImageUrl: imgUrl,
      defaultGoldRate22k: default22k,
      defaultGoldRate24k: default24k,
      defaultGoldRate18k: default18k,
      defaultSilverRate: defaultSilver,
      isActive: true,
    });
  }

  try {
    // 1. Deactivate old templates in Cloud SQL
    console.log('🔄 Deactivating previous month templates in Cloud SQL...');
    await db.update(schema.templates).set({ isActive: false }).where(eq(schema.templates.isActive, true));

    // 2. Insert or update the 60 fresh monthly templates
    console.log(`🌱 Inserting 60 fresh templates for ${monthName}...`);
    for (const t of newTemplates) {
      await db
        .insert(schema.templates)
        .values(t)
        .onConflictDoUpdate({
          target: schema.templates.templateId,
          set: {
            name: t.name,
            category: t.category,
            layoutType: t.layoutType,
            bgGradient: t.bgGradient,
            primaryColor: t.primaryColor,
            secondaryColor: t.secondaryColor,
            backgroundImageUrl: t.backgroundImageUrl,
            defaultGoldRate22k: t.defaultGoldRate22k,
            defaultGoldRate24k: t.defaultGoldRate24k,
            defaultGoldRate18k: t.defaultGoldRate18k,
            defaultSilverRate: t.defaultSilverRate,
            isActive: true,
          },
        });
    }

    console.log(`🎉 SUCCESS! Seeded 60 fresh monthly templates for ${monthName} ${now.getFullYear()} in Cloud SQL.`);
  } catch (dbErr: any) {
    console.error('❌ Cloud SQL template seeding failed:', dbErr.message);
    throw dbErr;
  } finally {
    await pool.end();
    console.log('🔌 Cloud SQL pool closed cleanly.');
  }
}

// Execute directly if run as main
if (process.argv[1] && process.argv[1].endsWith('monthly-scraper.ts')) {
  runMonthlyScraper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
