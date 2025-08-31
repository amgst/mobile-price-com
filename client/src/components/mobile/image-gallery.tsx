import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Card data-testid="image-gallery">
      <CardContent className="p-6">
        <div className="space-y-4">
          {images.map((image, index) => (
            <div key={index} className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden shadow-inner">
              <SafeImage
                src={image}
                alt={`${alt} image ${index + 1}`}
                className="w-full h-full object-contain rounded-lg"
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
