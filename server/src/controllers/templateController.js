const Template = require('../models/Template');
const PosterHistory = require('../models/PosterHistory');
const User = require('../models/User');

// Deterministic seed-based shuffling helper
const seedShuffle = (array, seedString) => {
  if (!seedString || array.length === 0) return array;

  // Hash seed string to integer
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0; // 32bit integer
  }

  // Seeded LCG pseudo-random generator
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
};

const getSubCategory = (template) => {
  const name = template.name.toLowerCase();
  if (name.includes('silver')) return 'silver';
  if (name.includes('diamond')) return 'diamond';
  if (name.includes('gold')) return 'gold';
  return 'silver'; // default fallback
};

// Optimal disjoint template partitioning helper based on user's registration order
const getUserTemplatesList = async (user, templatesPool) => {
  let userIndex = 0;
  if (user && user.role !== 'admin') {
    userIndex = await User.countDocuments({
      role: 'user',
      createdAt: { $lt: user.createdAt }
    });
  }

  const premiumPool = templatesPool.filter(t => t.category === 'premium');
  const festivalPool = templatesPool.filter(t => t.category === 'festival');

  let selectedTemplates = [];

  if (festivalPool.length > 0 && premiumPool.length > 0) {
    // Festival month: select 10 premium and 10 festival templates for each sub-category
    const premGold = premiumPool.filter(t => getSubCategory(t) === 'gold');
    const premDiamond = premiumPool.filter(t => getSubCategory(t) === 'diamond');
    const premSilver = premiumPool.filter(t => getSubCategory(t) === 'silver');

    const festGold = festivalPool.filter(t => getSubCategory(t) === 'gold');
    const festDiamond = festivalPool.filter(t => getSubCategory(t) === 'diamond');
    const festSilver = festivalPool.filter(t => getSubCategory(t) === 'silver');

    // Slice 10 Gold Premium + 10 Gold Festival (20 Gold total)
    if (premGold.length > 0) {
      const start = (userIndex * 10) % premGold.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(premGold[(start + i) % premGold.length]);
    }
    if (festGold.length > 0) {
      const start = (userIndex * 10) % festGold.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(festGold[(start + i) % festGold.length]);
    }

    // Slice 10 Diamond Premium + 10 Diamond Festival (20 Diamond total)
    if (premDiamond.length > 0) {
      const start = (userIndex * 10) % premDiamond.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(premDiamond[(start + i) % premDiamond.length]);
    }
    if (festDiamond.length > 0) {
      const start = (userIndex * 10) % festDiamond.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(festDiamond[(start + i) % festDiamond.length]);
    }

    // Slice 10 Silver Premium + 10 Silver Festival (20 Silver total)
    if (premSilver.length > 0) {
      const start = (userIndex * 10) % premSilver.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(premSilver[(start + i) % premSilver.length]);
    }
    if (festSilver.length > 0) {
      const start = (userIndex * 10) % festSilver.length;
      for (let i = 0; i < 10; i++) selectedTemplates.push(festSilver[(start + i) % festSilver.length]);
    }
  } else if (templatesPool.length > 0) {
    // Non-festival month: select 20 templates of each sub-category from the pool
    const goldPool = templatesPool.filter(t => getSubCategory(t) === 'gold');
    const diamondPool = templatesPool.filter(t => getSubCategory(t) === 'diamond');
    const silverPool = templatesPool.filter(t => getSubCategory(t) === 'silver');

    if (goldPool.length > 0) {
      const start = (userIndex * 20) % goldPool.length;
      for (let i = 0; i < 20; i++) selectedTemplates.push(goldPool[(start + i) % goldPool.length]);
    }
    if (diamondPool.length > 0) {
      const start = (userIndex * 20) % diamondPool.length;
      for (let i = 0; i < 20; i++) selectedTemplates.push(diamondPool[(start + i) % diamondPool.length]);
    }
    if (silverPool.length > 0) {
      const start = (userIndex * 20) % silverPool.length;
      for (let i = 0; i < 20; i++) selectedTemplates.push(silverPool[(start + i) % silverPool.length]);
    }
  }

  // Deterministically shuffle the selected 60 templates based on user ID for varied order representation
  return seedShuffle(selectedTemplates, user ? user._id.toString() : '');
};

// @desc    Get today's template (returns a default/featured active template)
// @route   GET /api/templates/today
// @access  Private
const getTodayTemplate = async (req, res, next) => {
  try {
    const allTemplates = await Template.find({ isActive: true });

    if (allTemplates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No templates found.',
      });
    }

    // Get the user's optimal sliced templates
    const userTemplates = await getUserTemplatesList(req.user, allTemplates);

    // Try to choose a festival template from user's subset first
    let eligible = userTemplates.filter(t => t.category === 'festival');
    if (eligible.length === 0) {
      eligible = userTemplates;
    }

    const template = eligible[0];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const isUsed = await PosterHistory.exists({
      user: req.user._id,
      templateId: template._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    res.status(200).json({
      success: true,
      template: {
        ...(template.toObject ? template.toObject() : template),
        isUsedThisMonth: !!isUsed
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getAllTemplates = async (req, res, next) => {
  try {
    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Find templates used by this user in the current month
    const usedHistory = await PosterHistory.find({
      user: req.user._id,
      templateId: { $ne: null },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).select('templateId');

    const usedIds = usedHistory.map(item => item.templateId.toString());

    const templates = await Template.find({ isActive: true });

    const templatesWithUsage = templates.map(t => {
      const isUsed = usedIds.includes(t._id.toString());
      return {
        ...t.toObject(),
        isUsedThisMonth: isUsed
      };
    });

    // Get the user's optimal sliced templates
    const slicedTemplates = await getUserTemplatesList(req.user, templatesWithUsage);

    res.status(200).json({
      success: true,
      count: slicedTemplates.length,
      templates: slicedTemplates,
      usedTemplateIds: usedIds
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found.',
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const isUsed = await PosterHistory.exists({
      user: req.user._id,
      templateId: template._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    res.status(200).json({
      success: true,
      template: {
        ...template.toObject(),
        isUsedThisMonth: !!isUsed
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayTemplate,
  getAllTemplates,
  getTemplateById,
};
