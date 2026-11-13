import html2canvas from 'html2canvas';

/**
 * Helper to convert Base64 data URL to Blob
 */
export const dataURIToBlob = (dataURI) => {
  try {
    const parts = dataURI.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (err) {
    console.error('Failed to convert data URI to blob:', err);
    return null;
  }
};

/**
 * Generates a WhatsApp sharing URL for daily jewelry rates (text only)
 */
export const getWhatsAppShareUrl = ({
  whatsappNumber,
}) => {
  const cleanNumber = whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '';

  if (cleanNumber) {
    return `https://wa.me/${cleanNumber}`;
  } else {
    return `https://api.whatsapp.com/send`;
  }
};

/**
 * Main helper to copy/share a poster image + open WhatsApp
 * @param {Object} params
 * @param {HTMLElement} [params.element] - The DOM element of the poster to capture
 * @param {string} [params.base64Image] - Pre-rendered base64 image (used for history page)
 * @param {string} params.shopName
 * @param {string} params.whatsappNumber
 * @param {number|string} params.gold22k
 * @param {number|string} params.gold24k
 * @param {number|string} params.gold18k
 * @param {number|string} params.silverRate
 * @param {string} params.date
 * @returns {Promise<{ success: boolean, method: string }>}
 */
export const sharePoster = async ({
  element,
  base64Image,
  shopName,
  whatsappNumber,
  gold22k,
  gold24k,
  gold18k,
  silverRate,
  date,
}) => {
  try {
    let blob = null;
    let generatedBase64 = base64Image || null;

    // 1. Get Blob
    if (base64Image) {
      blob = dataURIToBlob(base64Image);
    } else if (element) {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      
      generatedBase64 = canvas.toDataURL('image/png');
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
    }

    if (!blob) {
      throw new Error('Could not generate image blob.');
    }

    const filename = `gold-rates-${date || 'today'}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    // A. Native Share API (Chrome Android, Safari iOS, etc.)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Today's Gold Rates"
        });
        return { success: true, method: 'share', base64Image: generatedBase64 };
      } catch (err) {
        console.warn('Native share canceled or failed, falling back to clipboard...', err);
        // If user canceled the share sheet, we don't want to auto-open WhatsApp and show the modal
        if (err.name === 'AbortError') {
          return { success: false, reason: 'canceled' };
        }
      }
    }

    // B. Clipboard Write (Desktop Chrome, Firefox, WhatsApp Web fallback)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      // Open WhatsApp click-to-chat
      const url = getWhatsAppShareUrl({
        shopName,
        whatsappNumber,
        gold22k,
        gold24k,
        gold18k,
        silverRate,
        date,
      });
      window.open(url, '_blank');
      
      return { success: true, method: 'clipboard', base64Image: generatedBase64 };
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      
      // Open WhatsApp as text fallback anyway
      const url = getWhatsAppShareUrl({
        shopName,
        whatsappNumber,
        gold22k,
        gold24k,
        gold18k,
        silverRate,
        date,
      });
      window.open(url, '_blank');
      return { success: true, method: 'text-only', base64Image: generatedBase64 };
    }
  } catch (error) {
    console.error('Error sharing poster:', error);
    return { success: false, reason: error.message };
  }
};

export default getWhatsAppShareUrl;
