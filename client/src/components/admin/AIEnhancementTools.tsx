import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Wand2, BookOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Mobile } from "@shared/schema";

interface AIEnhancementToolsProps {
  mobile?: Mobile | null;
  onEnhancementComplete?: (enhancement: any) => void;
  onSpecsGenerated?: (specs: any) => void;
}

export function AIEnhancementTools({ mobile, onEnhancementComplete, onSpecsGenerated }: AIEnhancementToolsProps) {
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [year, setYear] = useState("2024");
  const [enhancement, setEnhancement] = useState<any>(null);
  const { toast } = useToast();

  const enhanceMutation = useMutation({
    mutationFn: async (mobileData: any) => {
      const response = await apiRequest("/api/admin/ai/enhance-mobile", {
        method: "POST",
        body: JSON.stringify({ mobileData }),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setEnhancement(data);
      onEnhancementComplete?.(data);
      toast({
        title: "Success",
        description: "AI enhancement completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enhance mobile data",
        variant: "destructive",
      });
    },
  });

  const generateSpecsMutation = useMutation({
    mutationFn: async ({ brand, model, year }: { brand: string; model: string; year?: string }) => {
      const response = await apiRequest("/api/admin/ai/generate-specs", {
        method: "POST",
        body: JSON.stringify({ brand, model, year }),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      onSpecsGenerated?.(data);
      toast({
        title: "Success",
        description: "Mobile specifications generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate specifications",
        variant: "destructive",
      });
    },
  });

  const detailedSpecsMutation = useMutation({
    mutationFn: async (mobileData: any) => {
      const response = await apiRequest("/api/admin/ai/detailed-specs", {
        method: "POST",
        body: JSON.stringify({ mobileData }),
        headers: { "Content-Type": "application/json" },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      onSpecsGenerated?.({ specifications: data.specifications });
      toast({
        title: "Success",
        description: "Detailed specifications generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate detailed specifications",
        variant: "destructive",
      });
    },
  });

  const handleEnhance = () => {
    if (mobile) {
      enhanceMutation.mutate(mobile);
    }
  };

  const handleGenerateSpecs = () => {
    if (brandName.trim() && modelName.trim()) {
      generateSpecsMutation.mutate({
        brand: brandName.trim(),
        model: modelName.trim(),
        year: year.trim() || "2024",
      });
    }
  };

  const handleGenerateDetailedSpecs = () => {
    if (mobile) {
      detailedSpecsMutation.mutate(mobile);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Enhancement Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate New Mobile Specs */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Mobile Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Brand Name</Label>
                <Input
                  id="brand"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Samsung, Apple, OnePlus"
                  data-testid="input-ai-brand"
                />
              </div>
              <div>
                <Label htmlFor="model">Model Name</Label>
                <Input
                  id="model"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g., Galaxy S24, iPhone 15"
                  data-testid="input-ai-model"
                />
              </div>
              <div>
                <Label htmlFor="year">Year (Optional)</Label>
                <Input
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2024"
                  data-testid="input-ai-year"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateSpecs}
              disabled={!brandName.trim() || !modelName.trim() || generateSpecsMutation.isPending}
              data-testid="button-generate-specs"
            >
              {generateSpecsMutation.isPending ? "Generating..." : "Generate Mobile Specs"}
            </Button>
          </div>

          {mobile && (
            <>
              <Separator />

              {/* Enhance Existing Mobile */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Enhance Current Mobile: {mobile.name}
                </h3>
                <div className="flex gap-4">
                  <Button
                    onClick={handleEnhance}
                    disabled={enhanceMutation.isPending}
                    data-testid="button-enhance-mobile"
                  >
                    {enhanceMutation.isPending ? "Enhancing..." : "Generate Marketing Content"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateDetailedSpecs}
                    disabled={detailedSpecsMutation.isPending}
                    data-testid="button-detailed-specs"
                  >
                    {detailedSpecsMutation.isPending ? "Generating..." : "Generate Detailed Specs"}
                  </Button>
                </div>
              </div>

              {/* Show Enhancement Results */}
              {enhancement && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold">AI Enhancement Results</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>SEO Description</Label>
                        <Textarea
                          value={enhancement.seoDescription}
                          readOnly
                          className="text-sm"
                          data-testid="text-seo-description"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {enhancement.seoDescription?.length || 0} characters
                        </p>
                      </div>
                      
                      <div>
                        <Label>Target Audience</Label>
                        <Textarea
                          value={enhancement.targetAudience}
                          readOnly
                          className="text-sm"
                          rows={3}
                          data-testid="text-target-audience"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Marketing Description</Label>
                      <Textarea
                        value={enhancement.marketingDescription}
                        readOnly
                        rows={4}
                        className="text-sm"
                        data-testid="text-marketing-description"
                      />
                    </div>

                    <div>
                      <Label>Key Features</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {enhancement.keyFeatures?.map((feature: string, index: number) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-feature-${index}`}>
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Comparison Points</Label>
                      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                        {enhancement.comparisonPoints?.map((point: string, index: number) => (
                          <li key={index} data-testid={`text-comparison-${index}`}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            AI Enhancement Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Generate Specs:</strong> Create realistic specifications for new mobile models</p>
          <p>• <strong>Marketing Content:</strong> Get SEO descriptions and engaging copy for existing phones</p>
          <p>• <strong>Detailed Specs:</strong> Generate comprehensive technical specifications automatically</p>
          <p>• <strong>Quality:</strong> AI uses current market standards and brand positioning for realistic results</p>
        </CardContent>
      </Card>
    </div>
  );
}