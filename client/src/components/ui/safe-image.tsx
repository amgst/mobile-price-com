import { useState, useEffect } from "react";
import { Image, ImageOff, Smartphone } from "lucide-react";

interface SafeImageProps {
  src: string | string[];
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  onLoad?: () => void;
  onError?: (failedSrc: string) => void;
  loading?: "lazy" | "eager";
  sizes?: string;
  placeholder?: string;
  quality?: "low" | "medium" | "high";
  [key: string]: any;
}

export function SafeImage({ 
  src, 
  alt, 
  className = "", 
  fallback, 
  showFallback = true,
  onLoad,
  onError,
  loading = "lazy",
  sizes,
  placeholder,
  quality = "high",
  ...props 
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Convert src to array for fallback handling
  const srcArray = Array.isArray(src) ? src : [src];
  
  // Add local fallback images to avoid CORS/ORB issues
  const brandFallbacks = [
    '/images/og-default-mobile.jpg',
    '/images/og-default.jpg'
  ];

  const allSources = [...srcArray, ...brandFallbacks];

  // Initialize with first available source
  useEffect(() => {
    const firstAvailableSource = allSources.find(url => !failedUrls.has(url));
    if (firstAvailableSource && currentSrc !== firstAvailableSource) {
      setCurrentSrc(firstAvailableSource);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    onError?.(currentSrc);
    
    // Mark current URL as failed
    const newFailedUrls = new Set(failedUrls);
    newFailedUrls.add(currentSrc);
    setFailedUrls(newFailedUrls);

    // Try next available source
    const nextSource = allSources.find(url => !newFailedUrls.has(url));
    
    if (nextSource) {
      setCurrentSrc(nextSource);
      setIsLoading(true);
      setHasError(false);
    } else {
      // All sources failed
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Generate optimized image URL based on quality setting
  const getOptimizedUrl = (url: string): string => {
    if (!url.includes('gsmarena.com')) return url;
    
    switch (quality) {
      case 'low':
        return url.replace('/bigpic/', '/thumbs/');
      case 'medium':
        return url.replace('/bigpic/', '/pics/');
      case 'high':
      default:
        return url; // Keep bigpic for highest quality
    }
  };

  if (hasError && !showFallback) {
    return null;
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`} {...props}>
        {fallback || (
          <div className="flex flex-col items-center justify-center space-y-3 p-4">
            <div className="relative">
              <Smartphone className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <ImageOff className="w-6 h-6 text-gray-400 dark:text-gray-500 absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Image not available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">High-quality images coming soon</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const optimizedSrc = getOptimizedUrl(currentSrc);

  return (
    <div className={`relative overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Progressive loading with blur effect */}
      {isLoading && placeholder && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110 transition-opacity duration-300"
          style={{ backgroundImage: `url(${placeholder})` }}
        />
      )}
      
      {/* Loading skeleton */}
      {isLoading && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative">
              <Smartphone className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        sizes={sizes}
        {...props}
      />

      {/* Quality indicator */}
      {quality === 'high' && !isLoading && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          HD
        </div>
      )}
    </div>
  );
}