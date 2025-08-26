import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Monitor, 
  Star, 
  Eye, 
  Palette, 
  Sun,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  X,
  Smartphone
} from "lucide-react";
import { aiAnalysisService, type ScreenQualityAnalysis } from "@/lib/ai-analysis-service";
import type { Mobile } from "@shared/schema";
import { getDisplaySpecs } from "@/lib/spec-helpers";
import { SafeImage } from "@/components/ui/safe-image";

interface ScreenQualityAnalyzerProps {
  mobile: Mobile;
  onClose?: () => void;
}

export function ScreenQualityAnalyzer({ mobile, onClose }: ScreenQualityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<ScreenQualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    analyzeScreen();
  }, [mobile.id]);

  const analyzeScreen = async () => {
    setIsLoading(true);
    setAnalysis(null);
    
    try {
      const result = await aiAnalysisService.analyzeScreenQuality(mobile);
      setAnalysis(result);
    } catch (error) {
      console.error('Screen analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Average";
    return "Poor";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Screen Quality Analysis</CardTitle>
                <p className="text-muted-foreground text-sm">
                  AI prediction of display experience from technical specifications
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
          {/* Phone Info */}
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-white p-2 shadow-sm">
                <SafeImage 
                  src={mobile.imageUrl} 
                  alt={mobile.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{mobile.name}</h3>
                <p className="text-muted-foreground capitalize">{mobile.brand} • {mobile.price}</p>
                <div className="text-sm text-muted-foreground mt-1">
                  {getDisplaySpecs(mobile).size !== "Not specified" && (
                    <span>{getDisplaySpecs(mobile).size} display</span>
                  )}
                  {getDisplaySpecs(mobile).resolution !== "Not specified" && (
                    <span> • {getDisplaySpecs(mobile).resolution}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-6 text-center">
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                <div>
                  <h3 className="font-semibold">Analyzing Display Specifications</h3>
                  <p className="text-sm text-muted-foreground">
                    AI is evaluating display technology and predicting user experience...
                  </p>
                </div>
                <Progress value={80} className="w-full max-w-sm mx-auto" />
              </div>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="p-6 text-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <Award className="h-5 w-5" />
                    <span className="font-semibold">Overall Display Score</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-indigo-600">
                      {analysis.overallScore.toFixed(1)}/10
                    </div>
                    <Badge 
                      variant={analysis.overallScore >= 8 ? "default" : analysis.overallScore >= 6 ? "secondary" : "destructive"}
                      className="text-sm"
                    >
                      {getScoreBadge(analysis.overallScore)}
                    </Badge>
                  </div>
                  
                  <Progress value={analysis.overallScore * 10} className="w-full max-w-md mx-auto" />
                </div>
              </Card>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Display Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center space-y-2">
                      <Smartphone className="h-8 w-8 mx-auto text-blue-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Sharpness</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.displayMetrics.sharpness)}`}>
                          {analysis.displayMetrics.sharpness.toFixed(1)}
                        </p>
                        <Progress value={analysis.displayMetrics.sharpness * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Palette className="h-8 w-8 mx-auto text-purple-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Color Accuracy</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.displayMetrics.colorAccuracy)}`}>
                          {analysis.displayMetrics.colorAccuracy.toFixed(1)}
                        </p>
                        <Progress value={analysis.displayMetrics.colorAccuracy * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Sun className="h-8 w-8 mx-auto text-yellow-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Brightness</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.displayMetrics.brightness)}`}>
                          {analysis.displayMetrics.brightness.toFixed(1)}
                        </p>
                        <Progress value={analysis.displayMetrics.brightness * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Eye className="h-8 w-8 mx-auto text-green-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Viewing Angles</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.displayMetrics.viewingAngles)}`}>
                          {analysis.displayMetrics.viewingAngles.toFixed(1)}
                        </p>
                        <Progress value={analysis.displayMetrics.viewingAngles * 10} className="w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Display Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      Potential Limitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Best Use Case */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Optimal Usage Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Best For:</h4>
                      <p className="text-muted-foreground">{analysis.bestUseCase}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Performance Summary:</h4>
                      <p className="text-muted-foreground">{analysis.comparison}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Display Specs Reference */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-3">Analysis based on display specifications:</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Screen Size:</span> {getDisplaySpecs(mobile).size}
                  </div>
                  <div>
                    <span className="font-medium">Resolution:</span> {getDisplaySpecs(mobile).resolution}
                  </div>
                  <div>
                    <span className="font-medium">Display Type:</span> {getDisplaySpecs(mobile).type}
                  </div>
                  <div>
                    <span className="font-medium">Refresh Rate:</span> {getDisplaySpecs(mobile).refreshRate}
                  </div>
                  <div>
                    <span className="font-medium">PPI:</span> {getDisplaySpecs(mobile).ppi}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={analyzeScreen} variant="outline" disabled={isLoading}>
                  <Monitor className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
                {onClose && (
                  <Button onClick={onClose}>
                    Close Analysis
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}