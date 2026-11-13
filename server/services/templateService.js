const Template = require('../models/Template');

/**
 * Returns today's date as YYYY-MM-DD string in local time
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates a default template record for a given date
 * Uses placeholder rates that the user is expected to edit
 */
const generateDefaultTemplate = async (date) => {
  const template = await Template.create({
    date,
    gold22k: 6500,
    gold24k: 7100,
    silverRate: 85,
    templateStyle: 'classic',
    isEdited: false,
  });
  return template;
};

module.exports = { getTodayDateString, generateDefaultTemplate };
