/**
 * Utility functions for text processing and formatting
 */

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extracts main camera megapixels from camera specification text
 */
export function extractMainCamera(cameraText: string): string {
  if (!cameraText) return "N/A";
  
  // Look for main camera megapixels (first number with MP)
  const mpMatch = cameraText.match(/(\d+)\s*MP/i);
  if (mpMatch) {
    return `${mpMatch[1]}MP`;
  }
  
  // Look for multiple camera setup
  const multiCameraMatch = cameraText.match(/(\d+)\s*MP.*(\d+)\s*MP.*(\d+)\s*MP/i);
  if (multiCameraMatch) {
    return `${multiCameraMatch[1]}MP + ${multiCameraMatch[2]}MP + ${multiCameraMatch[3]}MP`;
  }
  
  // Look for dual camera setup
  const dualCameraMatch = cameraText.match(/(\d+)\s*MP.*(\d+)\s*MP/i);
  if (dualCameraMatch) {
    return `${dualCameraMatch[1]}MP + ${dualCameraMatch[2]}MP`;
  }
  
  // Fallback to truncated text
  return truncateText(cameraText, 20);
}

/**
 * Formats camera specifications for compact display
 */
export function formatCompactCamera(cameraText: string): string {
  if (!cameraText) return "N/A";
  
  // Remove HTML tags if present
  const cleanText = cameraText.replace(/<[^>]*>/g, '');
  
  // Extract key camera info
  const mainCamera = extractMainCamera(cleanText);
  
  // Look for additional features
  const hasOIS = /OIS|optical.*stabilization/i.test(cleanText);
  const hasUltrawide = /ultrawide|wide.*angle/i.test(cleanText);
  const hasTelephoto = /telephoto|zoom/i.test(cleanText);
  
  let result = mainCamera;
  
  // Add key features as compact indicators
  const features = [];
  if (hasOIS) features.push("OIS");
  if (hasUltrawide) features.push("UW");
  if (hasTelephoto) features.push("Tele");
  
  if (features.length > 0) {
    result += ` (${features.join(', ')})`;
  }
  
  return result;
}

/**
 * Formats display specifications for compact display
 */
export function formatCompactDisplay(displayText: string): string {
  if (!displayText) return "N/A";
  
  // Remove HTML tags if present
  const cleanText = displayText.replace(/<[^>]*>/g, '');
  
  // Extract screen size
  const sizeMatch = cleanText.match(/(\d+\.?\d*)\s*[""]?/);
  const size = sizeMatch ? `${sizeMatch[1]}"` : "";
  
  // Extract resolution
  const resolutionMatch = cleanText.match(/(\d+)\s*x\s*(\d+)/i);
  const resolution = resolutionMatch ? `${resolutionMatch[1]}x${resolutionMatch[2]}` : "";
  
  // Extract display type
  const typeMatch = cleanText.match(/(OLED|AMOLED|LCD|IPS|Super AMOLED)/i);
  const type = typeMatch ? typeMatch[1] : "";
  
  // Combine the most important info
  const parts = [size, type].filter(Boolean);
  return parts.join(" ") || truncateText(cleanText, 20);
}

/**
 * Formats processor specifications for compact display
 */
export function formatCompactProcessor(processorText: string): string {
  if (!processorText) return "N/A";
  
  // Remove HTML tags if present
  const cleanText = processorText.replace(/<[^>]*>/g, '');
  
  // Extract key processor info
  const snapdragonMatch = cleanText.match(/Snapdragon\s*(\d+)/i);
  if (snapdragonMatch) {
    return `Snapdragon ${snapdragonMatch[1]}`;
  }
  
  const bionicsMatch = cleanText.match(/(A\d+)\s*Bionic/i);
  if (bionicsMatch) {
    return `${bionicsMatch[1]} Bionic`;
  }
  
  const dimensityMatch = cleanText.match(/Dimensity\s*(\d+)/i);
  if (dimensityMatch) {
    return `Dimensity ${dimensityMatch[1]}`;
  }
  
  const exynosMatch = cleanText.match(/Exynos\s*(\d+)/i);
  if (exynosMatch) {
    return `Exynos ${exynosMatch[1]}`;
  }
  
  // Fallback to truncated text
  return truncateText(cleanText, 25);
}