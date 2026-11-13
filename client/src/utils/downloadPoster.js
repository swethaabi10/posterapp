import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element as a PNG image
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - The name of the downloaded file
 * @returns {Promise<string>} - Returns base64 image data URL
 */
export const downloadPoster = async (element, filename = 'poster.png') => {
  if (!element) {
    throw new Error('Element not found for download');
  }

  // Use html2canvas to capture the poster element
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution scale
    useCORS: true, // Allow cross-origin images
    allowTaint: true,
    backgroundColor: null, // Transparent background if any
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // Trigger browser download
  const link = document.createElement('a');
  link.href = imgData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return imgData;
};

export default downloadPoster;
