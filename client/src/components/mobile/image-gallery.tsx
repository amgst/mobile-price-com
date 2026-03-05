import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const uniqueImages = Array.from(new Set((images || []).filter(Boolean)));

  // Don't render gallery for a single image.
  if (uniqueImages.length <= 1) {
    return null;
  }

  return (
    <Card data-testid="image-gallery">
      <CardContent className="p-6">
        <div className="space-y-4">
          {uniqueImages.map((image, index) => (
            <div
              key={index}
              className="aspect-[4/3] md:aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-inner p-3"
            >
              <SafeImage
                src={image}
                alt={`${alt} image ${index + 1}`}
                className="w-full h-full rounded-lg"
                objectFit="contain"
                quality="high"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                data-testid={`gallery-image-${index}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
