import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { 
  Palette, 
  Loader2,
  Search,
  X,
  Sparkles,
  Eye,
  Star
} from "lucide-react";
import { aiAnalysisService, type DesignSimilarityResult } from "@/lib/ai-analysis-service";
import type { Mobile } from "@shared/schema";
import { Link } from "wouter";
import { getBuildSpecs } from "@/lib/spec-helpers";

interface DesignSimilarityFinderProps {
  mobile: Mobile;
  onClose?: () => void;
}

export function DesignSimilarityFinder({ mobile, onClose }: DesignSimilarityFinderProps) {
  const [results, setResults] = useState<DesignSimilarityResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { data: allMobiles } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const findSimilarDesigns = async () => {
    if (!allMobiles) return;
    
    setIsAnalyzing(true);
    setResults([]);
    setAnalysisComplete(false);
    
    try {
      const similarities = await aiAnalysisService.findSimilarDesigns(mobile, allMobiles);
      setResults(similarities);
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Design similarity analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 70) return "text-green-600";
    if (similarity >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getSimilarityBadge = (similarity: number): { variant: "default" | "secondary" | "destructive", label: string } => {
    if (similarity >= 70) return { variant: "default", label: "Very Similar" };
    if (similarity >= 50) return { variant: "secondary", label: "Similar" };
    return { variant: "destructive", label: "Somewhat Similar" };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Design Similarity Finder</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Find phones with similar aesthetics and build quality
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
          {/* Target Phone */}
          <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
            <div className="flex items-center gap-4">
              <SafeImage
                src={mobile.imageUrl}
                alt={mobile.name}
                className="w-20 h-20 object-contain rounded-lg bg-white p-2 shadow-sm"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{mobile.name}</h3>
                <p className="text-muted-foreground capitalize">{mobile.brand} • {mobile.price}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {mobile.dimensions && (
                    <Badge variant="outline" className="text-xs">
                      {mobile.dimensions.height}×{mobile.dimensions.width}×{mobile.dimensions.thickness}mm
                    </Badge>
                  )}
                  {getBuildSpecs(mobile).build !== "Not specified" && (
                    <Badge variant="outline" className="text-xs">
                      {getBuildSpecs(mobile).build}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={findSimilarDesigns}
                disabled={isAnalyzing || !allMobiles}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Similar Designs
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                  <div>
                    <h3 className="font-semibold">Analyzing Design Aesthetics</h3>
                    <p className="text-sm text-muted-foreground">
                      AI is comparing build materials, form factors, and design languages...
                    </p>
                  </div>
                </div>
                <Progress value={70} className="w-full" />
              </div>
            </Card>
          )}

          {/* Results */}
          {analysisComplete && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-pink-500" />
                <h3 className="text-lg font-semibold">Similar Design Phones</h3>
                <Badge variant="secondary">{results.length} matches found</Badge>
              </div>

              <div className="grid gap-4">
                {results.slice(0, 8).map((result, index) => {
                  const similarMobile = allMobiles?.find(m => 
                    m.brand === result.similarAspects?.find(aspect => aspect.includes(m.brand)) ||
                    m.name.toLowerCase().includes(result.aestheticMatch.toLowerCase().split(' ')[0])
                  );
                  
                  if (!similarMobile) return null;

                  const badge = getSimilarityBadge(result.similarity);

                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <SafeImage
                            src={similarMobile.imageUrl}
                            alt={similarMobile.name}
                            className="w-20 h-20 object-contain rounded-lg"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{similarMobile.name}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {similarMobile.brand} • {similarMobile.price}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={badge.variant} className="mb-1">
                                  {result.similarity}% similar
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {badge.label}
                                </p>
                              </div>
                            </div>
                            
                            {/* Similar Aspects */}
                            {result.similarAspects.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-muted-foreground mb-1">Similar design elements:</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.similarAspects.slice(0, 3).map((aspect, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {aspect}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Key Differences */}
                            {result.keyDifferences.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-muted-foreground mb-1">Key differences:</p>
                                <p className="text-xs text-orange-600">
                                  {result.keyDifferences.slice(0, 2).join(", ")}
                                </p>
                              </div>
                            )}

                            {/* Aesthetic Match */}
                            <div className="mb-3">
                              <p className="text-xs text-blue-600 italic">
                                "{result.aestheticMatch}"
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/mobiles/${similarMobile.brand}/${similarMobile.slug}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                              <Link href="/compare">
                                <Button size="sm">
                                  Compare Phones
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
                    Showing top 8 matches of {results.length} similar designs found
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {analysisComplete && results.length === 0 && (
            <Card className="p-6 text-center">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Similar Designs Found</h3>
              <p className="text-sm text-muted-foreground">
                This phone has a unique design aesthetic in our current database
              </p>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-pink-500" />
              How Design Similarity Works
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• AI analyzes build materials, dimensions, and form factor</p>
              <p>• Compares camera module placement and button layout</p>
              <p>• Evaluates overall aesthetic language and design philosophy</p>
              <p>• Considers brand design consistency and market positioning</p>
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}