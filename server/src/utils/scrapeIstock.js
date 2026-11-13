const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LINKS = [
  { name: 'gold', assetId: '672123610' },
  { name: 'diamond', assetId: '2218969499' },
  { name: 'silver', assetId: '482058527' }
];

// Strict regex to identify human models, body parts, black/grey backgrounds, or placeholders
const strictBlacklistRegex = /\b(woman|women|model|girl|girls|man|men|boy|boys|lady|ladies|bride|groom|couple|hand|hands|face|faces|finger|fingers|skin|shoulder|shoulders|neck|wrist|body|person|people|ear|ears|chest|collarbone|human|black|grey|gray|night|holding|wear|wearing|mannequin|dummy|cloth|towel|fabric|saree|carpet|bedsheet|backgrounds|mockup|clipart|vector|drawings|illustration|isolated)\b/i;

/**
 * Scrape clean jewelry images from a specific iStock search more-like-this ID
 * @param {string} assetId 
 * @param {number} limit 
 * @param {number} startPage
 * @returns {Promise<string[]>}
 */
async function scrapeCategory(assetId, limit = 60, startPage = 1) {
  const images = [];
  let page = startPage;
  const maxPage = startPage + 4;
  let failures = 0;

  console.log(`🔍 Crawling iStock More-Like-This asset ID: ${assetId} (Limit: ${limit}, Pages: ${startPage}-${maxPage})...`);

  // Harvest session cookies from page 1 to bypass direct deep page entry blocks
  let sessionCookies = '';
  if (startPage > 1) {
    console.log(`  - Harvesting session cookies from page 1...`);
    try {
      const initRes = await axios.get(`https://www.istockphoto.com/search/more-like-this/${assetId}?assettype=image&page=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });
      const setCookie = initRes.headers['set-cookie'];
      if (setCookie) {
        sessionCookies = setCookie.map(c => c.split(';')[0]).join('; ');
        console.log(`    * Session cookies harvested successfully.`);
      }
    } catch (err) {
      console.warn(`    ⚠️ Failed to harvest session cookies: ${err.message}`);
    }
  }

  while (images.length < limit && page <= maxPage && failures < 3) {
    let url = `https://www.istockphoto.com/search/more-like-this/${assetId}?assettype=image&page=${page}`;
    console.log(`  - Fetching page ${page}...`);

    let html = '';
    let fetchedPage = page;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `https://www.istockphoto.com/search/more-like-this/${assetId}?assettype=image`,
      'Connection': 'keep-alive'
    };
    if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
    }

    try {
      const res = await axios.get(url, { headers, timeout: 10000 });
      html = res.data;
      
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        sessionCookies = setCookie.map(c => c.split(';')[0]).join('; ');
      }
    } catch (err) {
      console.warn(`    ⚠️ Failed to scrape page ${page}: ${err.message}`);
      if (page > 5) {
        const fallbackPage = ((page - 1) % 5) + 1;
        console.log(`    ℹ️ Page ${page} failed. Falling back to page ${fallbackPage}...`);
        url = `https://www.istockphoto.com/search/more-like-this/${assetId}?assettype=image&page=${fallbackPage}`;
        fetchedPage = fallbackPage;
        try {
          const res = await axios.get(url, { headers, timeout: 10000 });
          html = res.data;
        } catch (fallbackErr) {
          console.warn(`    ❌ Fallback page ${fallbackPage} also failed: ${fallbackErr.message}`);
          failures++;
          page++;
          continue;
        }
      } else {
        failures++;
        page++;
        continue;
      }
    }

    const imgTags = [];
    const fullImgRegex = /<img\s+([^>]+)>/gi;
    let match;
    while ((match = fullImgRegex.exec(html)) !== null) {
      imgTags.push(match[1]);
    }

    let addedThisPage = 0;
    let skippedHuman = 0;

    for (const tag of imgTags) {
      if (images.length >= limit) break;

      const srcMatch = tag.match(/src="([^"]+)"/i);
      if (!srcMatch) continue;

      const src = srcMatch[1].replace(/&amp;/g, '&');
      if (!src.includes('istockphoto.com/photos') && !src.includes('media.istockphoto.com')) {
        continue;
      }

      const altMatch = tag.match(/alt="([^"]+)"/i);
      const alt = altMatch ? altMatch[1] : '';

      if (!alt || alt.toLowerCase() === 'similar content thumbnail') {
        continue;
      }

      if (strictBlacklistRegex.test(alt)) {
        skippedHuman++;
        continue;
      }

      if (!images.includes(src)) {
        images.push(src);
        addedThisPage++;
      }
    }

    console.log(`    * Added ${addedThisPage} images (Fetched Page: ${fetchedPage}). Skipped ${skippedHuman} containing humans/amateur elements.`);

    if (addedThisPage === 0 && page > 5 && fetchedPage === page) {
      const fallbackPage = ((page - 1) % 5) + 1;
      console.log(`    ℹ️ Page ${page} returned 0 images. Attempting fallback page ${fallbackPage}...`);
      url = `https://www.istockphoto.com/search/more-like-this/${assetId}?assettype=image&page=${fallbackPage}`;
      try {
        const res = await axios.get(url, { headers, timeout: 10000 });
        const fallbackHtml = res.data;
        const fallbackImgTags = [];
        let fbMatch;
        while ((fbMatch = fullImgRegex.exec(fallbackHtml)) !== null) {
          fallbackImgTags.push(fbMatch[1]);
        }
        let addedFallback = 0;
        let skippedFbHuman = 0;
        for (const tag of fallbackImgTags) {
          if (images.length >= limit) break;
          const srcMatch = tag.match(/src="([^"]+)"/i);
          if (!srcMatch) continue;
          const src = srcMatch[1].replace(/&amp;/g, '&');
          if (!src.includes('istockphoto.com/photos') && !src.includes('media.istockphoto.com')) {
            continue;
          }
          const altMatch = tag.match(/alt="([^"]+)"/i);
          const alt = altMatch ? altMatch[1] : '';
          if (!alt || alt.toLowerCase() === 'similar content thumbnail') {
            continue;
          }
          if (strictBlacklistRegex.test(alt)) {
            skippedFbHuman++;
            continue;
          }
          if (!images.includes(src)) {
            images.push(src);
            addedFallback++;
          }
        }
        console.log(`    * Added ${addedFallback} images from fallback page ${fallbackPage}. Skipped ${skippedFbHuman} containing humans/amateur elements.`);
      } catch (fallbackErr) {
        console.warn(`    ❌ Fallback page ${fallbackPage} lookup failed: ${fallbackErr.message}`);
      }
    }

    failures = 0;
    page++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return images;
}

/**
 * Main scraper function returning clean templates background URLs (gold, diamond, silver)
 * @param {object} activeAssetIds
 * @param {number} startPage
 * @returns {Promise<{gold: string[], diamond: string[], silver: string[]}>}
 */
async function scrapeIstock(activeAssetIds = null, startPage = 1) {
  const result = { gold: [], diamond: [], silver: [] };

  // Load fallback URLs in case live scrape is blocked or fails
  let fallbackUrls = [];
  try {
    const fallbackPath = path.join(__dirname, '../../../unique_jewelry_urls.json');
    if (fs.existsSync(fallbackPath)) {
      fallbackUrls = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    }
  } catch (err) {
    console.error('⚠️ Could not load fallback JSON database:', err.message);
  }

  // Helper to get fallback images for a category
  const getFallbacks = (categoryName, limit) => {
    let list = [];
    if (categoryName === 'gold') {
      list = fallbackUrls.filter((_, idx) => idx % 3 === 0);
    } else if (categoryName === 'diamond') {
      list = fallbackUrls.filter((_, idx) => idx % 3 === 1);
    } else {
      list = fallbackUrls.filter((_, idx) => idx % 3 === 2);
    }
    return list.slice(0, limit);
  };

  // Scrape each link
  for (const item of LINKS) {
    try {
      const assetId = (activeAssetIds && activeAssetIds[item.name]) ? activeAssetIds[item.name] : item.assetId;
      const scraped = await scrapeCategory(assetId, 400, startPage);
      result[item.name] = scraped;
      console.log(`✨ Successfully harvested ${scraped.length} live iStock images for category [${item.name}].`);
    } catch (err) {
      console.error(`❌ Failed scraping category ${item.name}:`, err.message);
    }
  }

  return result;
}

module.exports = { scrapeIstock, scrapeCategory };
