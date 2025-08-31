import type { Mobile } from "@shared/schema";

export function findSpecValue(mobile: Mobile, category: string, feature: string): string {
  if (!mobile.specifications || !Array.isArray(mobile.specifications)) {
    return "Not specified";
  }

  const categorySpec = mobile.specifications.find(spec => 
    spec.category?.toLowerCase().includes(category.toLowerCase())
  );

  if (!categorySpec || !categorySpec.specs) {
    return "Not specified";
  }

  const featureSpec = categorySpec.specs.find(spec => 
    spec.feature?.toLowerCase().includes(feature.toLowerCase())
  );

  return featureSpec?.value || "Not specified";
}

export function getCameraSpecs(mobile: Mobile) {
  return {
    rear: findSpecValue(mobile, "camera", "rear") || findSpecValue(mobile, "camera", "main"),
    front: findSpecValue(mobile, "camera", "front") || findSpecValue(mobile, "camera", "selfie"),
    video: findSpecValue(mobile, "camera", "video"),
    features: mobile.specifications?.find(s => s.category?.toLowerCase().includes("camera"))?.specs?.map(s => s.feature) || []
  };
}

export function getDisplaySpecs(mobile: Mobile) {
  return {
    size: findSpecValue(mobile, "display", "size") || findSpecValue(mobile, "screen", "size"),
    resolution: findSpecValue(mobile, "display", "resolution"),
    type: findSpecValue(mobile, "display", "type") || findSpecValue(mobile, "display", "technology"),
    refreshRate: findSpecValue(mobile, "display", "refresh") || "60Hz",
    ppi: findSpecValue(mobile, "display", "ppi") || findSpecValue(mobile, "display", "density")
  };
}

export function getBuildSpecs(mobile: Mobile) {
  return {
    build: findSpecValue(mobile, "build", "material") || findSpecValue(mobile, "design", "build"),
    colors: mobile.specifications?.find(s => s.category?.toLowerCase().includes("design") || s.category?.toLowerCase().includes("build"))?.specs?.find(s => s.feature?.toLowerCase().includes("color"))?.value?.split(",") || []
  };
}