import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { 
  Upload, 
  Camera, 
  Search, 
  X, 
  Loader2,
  ImageIcon,
  Sparkles
} from "lucide-react";
import { aiAnalysisService, type PhotoSimilarityResult } from "@/lib/ai-analysis-service";
import type { Mobile } from "@shared/schema";
import { Link } from "wouter";

interface PhotoUploadSearchProps {
  onClose?: () => void;
}

export function PhotoUploadSearch({ onClose }: PhotoUploadSearchProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PhotoSimilarityResult[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allMobiles } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset previous results
      setResults([]);
      setAnalysisComplete(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !allMobiles) return;
    
    setIsAnalyzing(true);
    setResults([]);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(',')[1];
        if (base64) {
          const similarPhones = await aiAnalysisService.findSimilarPhones(base64, allMobiles);
          setResults(similarPhones);
          setAnalysisComplete(true);
        }
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Image analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults([]);
    setAnalysisComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Photo Upload Search</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Upload a phone photo to find similar looking devices
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="text-center">
              {!imagePreview ? (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Upload Phone Photo</p>
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop an image
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      JPG, PNG up to 10MB
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded phone" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            {selectedImage && (
              <div className="flex gap-3 justify-center">
                <Button onClick={clearImage} variant="outline">
                  Clear Image
                </Button>
                <Button 
                  onClick={analyzeImage} 
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Find Similar Phones
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-sm font-medium">Analyzing image with AI...</span>
                </div>
                <Progress value={85} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Comparing visual features with our mobile database
                </p>
              </div>
            </Card>
          )}

          {/* Results Section */}
          {analysisComplete && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Similar Phones Found</h3>
                <Badge variant="secondary">{results.length} matches</Badge>
              </div>

              <div className="grid gap-4">
                {results.slice(0, 8).map((result, index) => {
                  const mobile = allMobiles?.find(m => m.id === result.phoneId);
                  if (!mobile) return null;

                  return (
                    <Card key={result.phoneId} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <SafeImage
                            src={mobile.imageUrl}
                            alt={mobile.name}
                            className="w-16 h-16 object-contain rounded-lg"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{mobile.name}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {mobile.brand} • {mobile.price}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={result.similarity > 70 ? "default" : "secondary"}
                                  className="mb-1"
                                >
                                  {result.similarity}% match
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {result.confidence}% confidence
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Similar features:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.matchingFeatures.slice(0, 3).map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Link href={`/mobiles/${mobile.brand}/${mobile.slug}`}>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </Link>
                              <Link href="/compare">
                                <Button size="sm">
                                  Compare
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {results.length > 8 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing top 8 matches of {results.length} found
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {analysisComplete && results.length === 0 && (
            <Card className="p-6 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Similar Phones Found</h3>
              <p className="text-sm text-muted-foreground">
                Try uploading a clearer image or a different angle of the phone
              </p>
            </Card>
          )}

          {/* Tips */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <h4 className="font-medium text-sm mb-2">Tips for better results:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use clear, well-lit photos of the phone</li>
              <li>• Include the entire phone in the frame</li>
              <li>• Avoid reflections and shadows</li>
              <li>• Front or back view works best</li>
            </ul>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}