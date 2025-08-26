import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Star, 
  Sun, 
  Moon, 
  User, 
  Video,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  X
} from "lucide-react";
import { aiAnalysisService, type CameraQualityAnalysis } from "@/lib/ai-analysis-service";
import type { Mobile } from "@shared/schema";
import { getCameraSpecs } from "@/lib/spec-helpers";
import { SafeImage } from "@/components/ui/safe-image";

interface CameraQualityAnalyzerProps {
  mobile: Mobile;
  onClose?: () => void;
}

export function CameraQualityAnalyzer({ mobile, onClose }: CameraQualityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<CameraQualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    analyzeCamera();
  }, [mobile.id]);

  const analyzeCamera = async () => {
    setIsLoading(true);
    setAnalysis(null);
    
    try {
      const result = await aiAnalysisService.analyzeCameraQuality(mobile);
      setAnalysis(result);
    } catch (error) {
      console.error('Camera analysis failed:', error);
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
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Camera Quality Analysis</CardTitle>
                <p className="text-muted-foreground text-sm">
                  AI-powered prediction of real-world camera performance
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
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
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
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-6 text-center">
              <div className="space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <div>
                  <h3 className="font-semibold">Analyzing Camera Specifications</h3>
                  <p className="text-sm text-muted-foreground">
                    AI is evaluating camera hardware and predicting real-world performance...
                  </p>
                </div>
                <Progress value={75} className="w-full max-w-sm mx-auto" />
              </div>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="p-6 text-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                    <Award className="h-5 w-5" />
                    <span className="font-semibold">Overall Camera Score</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-blue-600">
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

              {/* Detailed Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center space-y-2">
                      <Sun className="h-8 w-8 mx-auto text-yellow-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Daylight Photos</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.photoQuality.daylight)}`}>
                          {analysis.photoQuality.daylight.toFixed(1)}
                        </p>
                        <Progress value={analysis.photoQuality.daylight * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Moon className="h-8 w-8 mx-auto text-blue-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Low Light</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.photoQuality.lowLight)}`}>
                          {analysis.photoQuality.lowLight.toFixed(1)}
                        </p>
                        <Progress value={analysis.photoQuality.lowLight * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <User className="h-8 w-8 mx-auto text-purple-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Portrait Mode</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.photoQuality.portrait)}`}>
                          {analysis.photoQuality.portrait.toFixed(1)}
                        </p>
                        <Progress value={analysis.photoQuality.portrait * 10} className="w-full" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <Video className="h-8 w-8 mx-auto text-red-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Video Quality</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analysis.photoQuality.video)}`}>
                          {analysis.photoQuality.video.toFixed(1)}
                        </p>
                        <Progress value={analysis.photoQuality.video * 10} className="w-full" />
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
                      Camera Strengths
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
                      Areas for Improvement
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

              {/* Real-world Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Real-World Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{analysis.realWorldComparison}</p>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="font-medium mb-3">Recommended For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.recommendedFor.map((use, index) => (
                        <Badge key={index} variant="outline">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Camera Specs Reference */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-2">Analysis based on specifications:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Main Camera:</span> {getCameraSpecs(mobile).rear}
                  </div>
                  <div>
                    <span className="font-medium">Front Camera:</span> {getCameraSpecs(mobile).front}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={analyzeCamera} variant="outline" disabled={isLoading}>
                  <Camera className="h-4 w-4 mr-2" />
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