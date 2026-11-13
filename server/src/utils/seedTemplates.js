const Template = require('../models/Template');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');

const fs = require('fs');
const path = require('path');

let backgroundImages = [];
try {
  const fileContent = fs.readFileSync(path.join(__dirname, '../../../unique_jewelry_urls.json'), 'utf8');
  backgroundImages = JSON.parse(fileContent);
  console.log(`🌱 Loaded ${backgroundImages.length} unique jewelry background images from unique_jewelry_urls.json`);
} catch (err) {
  console.error('❌ Failed to load unique_jewelry_urls.json:', err.message);
  for (let i = 0; i < 510; i++) {
    backgroundImages.push(`https://loremflickr.com/600/800/jewelry?lock=${i + 1}`);
  }
}

const templatesData = [
  // 1-20: Hardcoded core visual styles
  {
    name: "Royal Navy Gold Frame",
    category: "premium",
    layoutType: "fullBleed",
    colors: { background: "#1a1a2e", primary: "#d4a017", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[0],
    defaultGoldRate22k: 6600,
    defaultGoldRate24k: 7200,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Emerald Green Elegance",
    category: "premium",
    layoutType: "splitTopBottom",
    colors: { background: "#052214", primary: "#10b981", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[1],
    defaultGoldRate22k: 6650,
    defaultGoldRate24k: 7250,
    defaultSilverRate: 86,
    isActive: true
  },
  {
    name: "Ruby Crimson Ornate",
    category: "premium",
    layoutType: "imageLeft",
    colors: { background: "#2b050c", primary: "#ef4444", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[2],
    defaultGoldRate22k: 6700,
    defaultGoldRate24k: 7300,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Golden Glitter Luxury",
    category: "premium",
    layoutType: "imageRight",
    colors: { background: "#241d0b", primary: "#e8b923", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[3],
    defaultGoldRate22k: 6720,
    defaultGoldRate24k: 7320,
    defaultSilverRate: 89,
    isActive: true
  },
  {
    name: "Charcoal Minimalist",
    category: "minimal",
    layoutType: "fullBleed",
    colors: { background: "#121212", primary: "#ffffff", secondary: "#e5e7eb" },
    backgroundImageUrl: backgroundImages[4],
    defaultGoldRate22k: 6580,
    defaultGoldRate24k: 7180,
    defaultSilverRate: 84,
    isActive: true
  },
  {
    name: "Rose Gold Floral",
    category: "premium",
    layoutType: "splitTopBottom",
    colors: { background: "#2c1619", primary: "#fda4af", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[5],
    defaultGoldRate22k: 6640,
    defaultGoldRate24k: 7240,
    defaultSilverRate: 87,
    isActive: true
  },
  {
    name: "Indian Mandap Feast",
    category: "festival",
    layoutType: "imageLeft",
    colors: { background: "#381005", primary: "#fbbf24", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[6],
    defaultGoldRate22k: 6680,
    defaultGoldRate24k: 7280,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Modern Purple Geometric",
    category: "minimal",
    layoutType: "imageRight",
    colors: { background: "#130a1c", primary: "#a855f7", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[7],
    defaultGoldRate22k: 6610,
    defaultGoldRate24k: 7210,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Vintage Gold Lace",
    category: "minimal",
    layoutType: "fullBleed",
    colors: { background: "#1c1409", primary: "#d4af37", secondary: "#f7e7ce" },
    backgroundImageUrl: backgroundImages[8],
    defaultGoldRate22k: 6630,
    defaultGoldRate24k: 7230,
    defaultSilverRate: 86,
    isActive: true
  },
  {
    name: "Ivory Marble Class",
    category: "minimal",
    layoutType: "splitTopBottom",
    colors: { background: "#f3f4f6", primary: "#1f2937", secondary: "#111827" },
    backgroundImageUrl: backgroundImages[9],
    defaultGoldRate22k: 6590,
    defaultGoldRate24k: 7190,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Celestial Blue Night",
    category: "daily",
    layoutType: "imageLeft",
    colors: { background: "#050b18", primary: "#60a5fa", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[10],
    defaultGoldRate22k: 6620,
    defaultGoldRate24k: 7220,
    defaultSilverRate: 86,
    isActive: true
  },
  {
    name: "Festive Yellow Marigold",
    category: "festival",
    layoutType: "imageRight",
    colors: { background: "#2b1d03", primary: "#f59e0b", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[11],
    defaultGoldRate22k: 6670,
    defaultGoldRate24k: 7270,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Black Pearl Premium",
    category: "premium",
    layoutType: "fullBleed",
    colors: { background: "#090a0f", primary: "#e5e7eb", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[12],
    defaultGoldRate22k: 6750,
    defaultGoldRate24k: 7350,
    defaultSilverRate: 90,
    isActive: true
  },
  {
    name: "Sunburst Gold Radiance",
    category: "premium",
    layoutType: "splitTopBottom",
    colors: { background: "#1a1303", primary: "#fbbf24", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[13],
    defaultGoldRate22k: 6710,
    defaultGoldRate24k: 7310,
    defaultSilverRate: 89,
    isActive: true
  },
  {
    name: "Teal Peacock Heritage",
    category: "festival",
    layoutType: "imageLeft",
    colors: { background: "#022329", primary: "#06b6d4", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[14],
    defaultGoldRate22k: 6660,
    defaultGoldRate24k: 7260,
    defaultSilverRate: 87,
    isActive: true
  },
  {
    name: "Palace Arch Heritage",
    category: "festival",
    layoutType: "imageRight",
    colors: { background: "#1c0e03", primary: "#d97706", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[15],
    defaultGoldRate22k: 6690,
    defaultGoldRate24k: 7290,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Fluid Gold Waves",
    category: "daily",
    layoutType: "fullBleed",
    colors: { background: "#1e1b18", primary: "#ca8a04", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[16],
    defaultGoldRate22k: 6620,
    defaultGoldRate24k: 7220,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Burgundy Silk Smooth",
    category: "premium",
    layoutType: "splitTopBottom",
    colors: { background: "#1f0208", primary: "#f43f5e", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[17],
    defaultGoldRate22k: 6730,
    defaultGoldRate24k: 7330,
    defaultSilverRate: 89,
    isActive: true
  },
  {
    name: "Platinum Minimalist Shine",
    category: "minimal",
    layoutType: "imageLeft",
    colors: { background: "#2d3748", primary: "#cbd5e0", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[18],
    defaultGoldRate22k: 6600,
    defaultGoldRate24k: 7200,
    defaultSilverRate: 84,
    isActive: true
  },
  {
    name: "Antique Bronze Classic",
    category: "daily",
    layoutType: "imageRight",
    colors: { background: "#18110a", primary: "#78350f", secondary: "#dfc29f" },
    backgroundImageUrl: backgroundImages[19],
    defaultGoldRate22k: 6570,
    defaultGoldRate24k: 7170,
    defaultSilverRate: 83,
    isActive: true
  },

  // 21-40: Tamil specific templates
  {
    name: "Minimal Tamil Banner",
    category: "Tamil",
    layoutType: "fullBleed",
    colors: { background: "#1a1a2e", primary: "#d4a017", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[20],
    defaultGoldRate22k: 6600,
    defaultGoldRate24k: 7200,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Festival Offer – Diwali Tamil",
    category: "Tamil",
    layoutType: "splitTopBottom",
    colors: { background: "#381005", primary: "#fbbf24", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[21],
    defaultGoldRate22k: 6680,
    defaultGoldRate24k: 7280,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Pongal Special Festival Offer",
    category: "Tamil",
    layoutType: "imageLeft",
    colors: { background: "#052214", primary: "#10b981", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[22],
    defaultGoldRate22k: 6650,
    defaultGoldRate24k: 7250,
    defaultSilverRate: 86,
    isActive: true
  },
  {
    name: "Tamil Daily Gold Rate Card",
    category: "Tamil",
    layoutType: "imageRight",
    colors: { background: "#2b1d03", primary: "#f59e0b", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[23],
    defaultGoldRate22k: 6610,
    defaultGoldRate24k: 7210,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "Aadi Perukku Premium Offer",
    category: "Tamil",
    layoutType: "fullBleed",
    colors: { background: "#2b050c", primary: "#ef4444", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[24],
    defaultGoldRate22k: 6720,
    defaultGoldRate24k: 7320,
    defaultSilverRate: 89,
    isActive: true
  },
  {
    name: "Chithirai Thirunal Traditional",
    category: "Tamil",
    layoutType: "splitTopBottom",
    colors: { background: "#2b1405", primary: "#f97316", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[25],
    defaultGoldRate22k: 6670,
    defaultGoldRate24k: 7270,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Tamil Puthandu Special Banner",
    category: "Tamil",
    layoutType: "imageLeft",
    colors: { background: "#1a1303", primary: "#fbbf24", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[26],
    defaultGoldRate22k: 6640,
    defaultGoldRate24k: 7240,
    defaultSilverRate: 86,
    isActive: true
  },

  // 41-55: English specific templates
  {
    name: "Elegant English Daily Banner",
    category: "English",
    layoutType: "fullBleed",
    colors: { background: "#121212", primary: "#ffffff", secondary: "#e5e7eb" },
    backgroundImageUrl: backgroundImages[27],
    defaultGoldRate22k: 6590,
    defaultGoldRate24k: 7190,
    defaultSilverRate: 85,
    isActive: true
  },
  {
    name: "New Wedding Season Gold rate",
    category: "English",
    layoutType: "splitTopBottom",
    colors: { background: "#241d0b", primary: "#e8b923", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[28],
    defaultGoldRate22k: 6710,
    defaultGoldRate24k: 7310,
    defaultSilverRate: 88,
    isActive: true
  },
  {
    name: "Simple English Daily Rate",
    category: "English",
    layoutType: "imageLeft",
    colors: { background: "#050b18", primary: "#60a5fa", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[29],
    defaultGoldRate22k: 6600,
    defaultGoldRate24k: 7200,
    defaultSilverRate: 84,
    isActive: true
  },
  {
    name: "English Premium Minimal Gold",
    category: "English",
    layoutType: "imageRight",
    colors: { background: "#1e1b18", primary: "#ca8a04", secondary: "#ffffff" },
    backgroundImageUrl: backgroundImages[30],
    defaultGoldRate22k: 6630,
    defaultGoldRate24k: 7230,
    defaultSilverRate: 86,
    isActive: true
  },

  // 56-505: Dynamic combinations to achieve a total of 500+ amazing poster templates
  ...Array.from({ length: 475 }, (_, idx) => {
    const categories = [
      "daily", "festival", "premium", "minimal", "Tamil", "English", "offer", 
      "wedding", "new-arrivals", "weekend", "vintage", "modern", "luxury"
    ];
    const colorsList = [
      { background: "#0a1628", primary: "#d4a017", secondary: "#ffffff" },
      { background: "#052214", primary: "#10b981", secondary: "#ffffff" },
      { background: "#2b050c", primary: "#ef4444", secondary: "#ffffff" },
      { background: "#241d0b", primary: "#e8b923", secondary: "#ffffff" },
      { background: "#121212", primary: "#ffffff", secondary: "#e5e7eb" },
      { background: "#18110a", primary: "#78350f", secondary: "#dfc29f" },
      { background: "#050b18", primary: "#60a5fa", secondary: "#ffffff" },
      { background: "#1f0208", primary: "#f43f5e", secondary: "#ffffff" },
      { background: "#130a1c", primary: "#a855f7", secondary: "#ffffff" },
      { background: "#2b1405", primary: "#f97316", secondary: "#ffffff" },
      { background: "#0b1a10", primary: "#c9971a", secondary: "#ffffff" },
      { background: "#3a030b", primary: "#fcd34d", secondary: "#ffffff" },
      { background: "#021a2e", primary: "#eab308", secondary: "#ffffff" }
    ];
    const layouts = ["fullBleed", "splitTopBottom", "imageLeft", "imageRight"];

    const cat = categories[idx % categories.length];
    const color = colorsList[idx % colorsList.length];
    const lay = layouts[idx % layouts.length];
    const num = idx + 31;

    // Grab a unique background image style for every dynamic template
    const bgImg = backgroundImages[idx + 31];

    return {
      name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Jewelry Banner No. ${num}`,
      category: cat,
      layoutType: lay,
      colors: color,
      backgroundImageUrl: bgImg,
      defaultGoldRate22k: 6600 + (idx * 3),
      defaultGoldRate24k: 7200 + (idx * 3),
      defaultGoldRate18k: Math.round((6600 + (idx * 3)) * 18 / 22),
      defaultSilverRate: 85 + (idx % 6),
      isActive: true
    };
  })
];

const seedTemplates = async () => {
  try {
    // Check if templates are already seeded
    const templateCount = await Template.countDocuments();
    if (templateCount === 0) {
      // Ensure all templates have defaultGoldRate18k calculated
      templatesData.forEach(t => {
        if (t.defaultGoldRate18k === undefined) {
          t.defaultGoldRate18k = Math.round(t.defaultGoldRate22k * 18 / 22);
        }
      });
      console.log('🌱 Database templates collection is empty. Seeding 500+ templates...');
      const templates = await Template.insertMany(templatesData);
      console.log(`✅ Seeding templates completed! Registered ${templates.length} templates.`);
    } else {
      console.log(`ℹ️ Templates already seeded (${templateCount} items). Skipping template seeding.`);
    }

    // Check if default admin user exists
    const adminExists = await User.findOne({ email: 'admin@goldshop.com' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@goldshop.com',
        password: 'password123',
        shopName: 'Admin Central',
        role: 'admin',
        paymentStatus: 'approved',
      });
      console.log('🛡️ Default admin user seeded (admin@goldshop.com / password123)');
    } else {
      console.log('🛡️ Default admin user already exists.');
    }

  } catch (err) {
    console.error('❌ Error seeding templates:', err.message);
  }
};

module.exports = seedTemplates;
