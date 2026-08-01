import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getProductImageUrl } from "@/lib/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertMobileSchema } from "@shared/schema";
import { AIEnhancementTools } from "./AIEnhancementTools";
import { z } from "zod";
import type { Mobile, Brand } from "@shared/schema";

interface AdminMobileFormProps {
  mobile?: Mobile | null;
  brands: Brand[];
  onSuccess: () => void;
}

const formSchema = insertMobileSchema.extend({
  carouselImages: z.array(
    z.string().min(1, "Image is required").refine((value) => {
      const v = value.trim();
      if (!v) return false;
      if (v.startsWith("http://") || v.startsWith("https://")) return true;
      if (v.startsWith("/")) return true;
      if (v.startsWith("products/")) return true;
      return /^[a-zA-Z0-9][a-zA-Z0-9_\-./ ]*\.(png|jpg|jpeg|webp|gif|svg)$/i.test(v);
    }, "Use a valid image URL or filename (e.g., mobile.png, /products/mobile.png)")
  ).min(1, "At least one image is required"),
  specifications: z.array(z.object({
    category: z.string().min(1, "Category is required"),
    specs: z.array(z.object({
      feature: z.string().min(1, "Feature is required"),
      value: z.string().min(1, "Value is required"),
    })).min(1, "At least one spec is required"),
  })),
});

type FormData = z.infer<typeof formSchema>;

function collectErrorMessages(errors: any, path: string[] = []): string[] {
  if (!errors || typeof errors !== "object") return [];

  const messages: string[] = [];

  if (typeof errors.message === "string") {
    const label = path.length ? `${path.join(".")}: ` : "";
    messages.push(`${label}${errors.message}`);
  }

  for (const [key, value] of Object.entries(errors)) {
    if (key === "message" || key === "type" || key === "ref") continue;
    messages.push(...collectErrorMessages(value, [...path, key]));
  }

  return messages;
}

function parseApiErrorMessage(error: any): string {
  const fallback = "Failed to save mobile";
  const raw = typeof error?.message === "string" ? error.message : "";

  if (!raw) return fallback;

  const jsonPartStart = raw.indexOf("{");
  if (jsonPartStart === -1) return raw;

  try {
    const parsed = JSON.parse(raw.slice(jsonPartStart));
    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
      const details = parsed.errors
        .map((e: any) => e?.message)
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
      if (details) return `${parsed.message || "Validation error"}: ${details}`;
    }
    return parsed?.message || raw;
  } catch {
    return raw;
  }
}

export function AdminMobileForm({ mobile, brands, onSuccess }: AdminMobileFormProps) {
  const { toast } = useToast();
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [currentSpecFeature, setCurrentSpecFeature] = useState("");
  const [currentSpecValue, setCurrentSpecValue] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!mobile);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: mobile ? {
      slug: mobile.slug,
      name: mobile.name,
      brand: mobile.brand,
      model: mobile.model,
      imageUrl: mobile.imageUrl,
      imagekitPath: mobile.imagekitPath || "",
      releaseDate: mobile.releaseDate,
      price: mobile.price || "",
      shortSpecs: mobile.shortSpecs,
      carouselImages: mobile.carouselImages,
      specifications: mobile.specifications,
      dimensions: mobile.dimensions || { height: "", width: "", thickness: "", weight: "" },
      buildMaterials: mobile.buildMaterials || { frame: "", back: "", protection: "" },
    } : {
      slug: "",
      name: "",
      brand: "",
      model: "",
      imageUrl: "",
      imagekitPath: "",
      releaseDate: "",
      price: "",
      shortSpecs: {
        ram: "",
        storage: "",
        camera: "",
        battery: "",
        display: "",
        processor: "",
      },
      carouselImages: [],
      specifications: [],
      dimensions: { height: "", width: "", thickness: "", weight: "" },
      buildMaterials: { frame: "", back: "", protection: "" },
    },
  });

  const {
    fields: carouselFields,
    append: appendCarouselImage,
    remove: removeCarouselImage,
  } = useFieldArray({
    control: form.control,
    name: "carouselImages",
  });

  const {
    fields: specFields,
    append: appendSpecification,
    remove: removeSpecification,
    update: updateSpecification,
  } = useFieldArray({
    control: form.control,
    name: "specifications",
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    if (slugManuallyEdited || mobile) return;

    const generatedSlug = (watchedName || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    form.setValue("slug", generatedSlug, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [watchedName, slugManuallyEdited, mobile, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const cleanData = {
        ...data,
        imageUrl: getProductImageUrl(data.imageUrl),
        carouselImages: (data.carouselImages || []).map((img) => getProductImageUrl(img)),
        dimensions: data.dimensions?.height ? data.dimensions : null,
        buildMaterials: data.buildMaterials?.frame ? data.buildMaterials : null,
        shortSpecs: {
          ram: data.shortSpecs.ram,
          storage: data.shortSpecs.storage,
          camera: data.shortSpecs.camera,
          battery: data.shortSpecs.battery || undefined,
          display: data.shortSpecs.display || undefined,
          processor: data.shortSpecs.processor || undefined,
        },
      };

      if (mobile) {
        return await apiRequest(`/api/admin/mobiles/${mobile.id}`, {
          method: "PUT",
          body: JSON.stringify(cleanData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return await apiRequest("/api/admin/mobiles", {
          method: "POST",
          body: JSON.stringify(cleanData),
          headers: { "Content-Type": "application/json" },
        });
      }
    },
      onSuccess: () => {
      toast({
        title: "Success",
        description: `Mobile ${mobile ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          parseApiErrorMessage(error) || `Failed to ${mobile ? "update" : "create"} mobile`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const onInvalidSubmit = (errors: any) => {
    const messages = collectErrorMessages(errors);
    const summary =
      messages.length > 0
        ? messages.slice(0, 3).join(" | ")
        : "Please fill all required fields before saving";

    toast({
      title: "Missing required fields",
      description: summary,
      variant: "destructive",
    });
  };

  const addCarouselImage = () => {
    if (currentImageUrl.trim()) {
      appendCarouselImage(currentImageUrl.trim());
      setCurrentImageUrl("");
    }
  };

  const addSpecToCategory = (categoryIndex: number) => {
    if (currentSpecFeature.trim() && currentSpecValue.trim()) {
      const category = form.getValues(`specifications.${categoryIndex}`);
      const updatedCategory = {
        ...category,
        specs: [...category.specs, { feature: currentSpecFeature.trim(), value: currentSpecValue.trim() }],
      };
      updateSpecification(categoryIndex, updatedCategory);
      setCurrentSpecFeature("");
      setCurrentSpecValue("");
    }
  };

  const removeSpecFromCategory = (categoryIndex: number, specIndex: number) => {
    const category = form.getValues(`specifications.${categoryIndex}`);
    const updatedCategory = {
      ...category,
      specs: category.specs.filter((_, index) => index !== specIndex),
    };
    updateSpecification(categoryIndex, updatedCategory);
  };

  const addSpecificationCategory = () => {
    appendSpecification({
      category: "",
      specs: [],
    });
  };

  const handleAIEnhancement = (enhancement: any) => {
    // You can use the enhancement data to populate form fields if needed
    console.log("AI Enhancement received:", enhancement);
  };

  const handleSpecsGenerated = (specs: any) => {
    if (specs.name) form.setValue("name", specs.name);
    if (specs.brand) form.setValue("brand", specs.brand, { shouldValidate: true });
    if (specs.model) form.setValue("model", specs.model);
    if (specs.price) form.setValue("price", specs.price);
    if (specs.releaseDate) form.setValue("releaseDate", specs.releaseDate);
    if (specs.shortSpecs) {
      if (specs.shortSpecs.ram) form.setValue("shortSpecs.ram", specs.shortSpecs.ram);
      if (specs.shortSpecs.storage) form.setValue("shortSpecs.storage", specs.shortSpecs.storage);
      if (specs.shortSpecs.camera) form.setValue("shortSpecs.camera", specs.shortSpecs.camera);
      if (specs.shortSpecs.battery) form.setValue("shortSpecs.battery", specs.shortSpecs.battery);
      if (specs.shortSpecs.display) form.setValue("shortSpecs.display", specs.shortSpecs.display);
      if (specs.shortSpecs.processor) form.setValue("shortSpecs.processor", specs.shortSpecs.processor);
    }
    if (specs.specifications?.length) {
      form.setValue("specifications", specs.specifications);
    }
    if (specs.dimensions) {
      form.setValue("dimensions", specs.dimensions);
    }
    if (specs.buildMaterials) {
      form.setValue("buildMaterials", specs.buildMaterials);
    }
    if (specs.imageUrl) {
      form.setValue("imageUrl", specs.imageUrl, { shouldValidate: true });
    }
    if (specs.carouselImages?.length) {
      form.setValue("carouselImages", specs.carouselImages, { shouldValidate: true });
    }
    // Generate slug from the AI-provided slug, or derive one from the name
    const slug = specs.slug || (specs.name
      ? specs.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
      : "");
    if (slug) {
      setSlugManuallyEdited(true);
      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Enhancement Tools */}
      <AIEnhancementTools
        mobile={mobile}
        onEnhancementComplete={handleAIEnhancement}
        onSpecsGenerated={handleSpecsGenerated}
      />

      <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
        {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Samsung Galaxy S24 Ultra"
                data-testid="input-mobile-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...form.register("model")}
                placeholder="e.g., Galaxy S24 Ultra"
                data-testid="input-mobile-model"
              />
              {form.formState.errors.model && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={form.watch("brand")}
                onValueChange={(value) => form.setValue("brand", value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger data-testid="select-mobile-brand">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.slug}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.brand && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.brand.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...form.register("slug")}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  form.setValue("slug", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                placeholder="e.g., galaxy-s24-ultra"
                data-testid="input-mobile-slug"
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                {...form.register("price")}
                placeholder="e.g., Rs 449,999"
                data-testid="input-mobile-price"
              />
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                type="date"
                {...form.register("releaseDate")}
                data-testid="input-mobile-release-date"
              />
              {form.formState.errors.releaseDate && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.releaseDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image (URL or Filename)</Label>
            <Input
              id="imageUrl"
              {...form.register("imageUrl")}
              placeholder="https://example.com/image.jpg or /products/phone.jpg or phone.jpg"
              data-testid="input-mobile-image-url"
            />
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.imageUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="imagekitPath">ImageKit Path (Optional)</Label>
            <Input
              id="imagekitPath"
              {...form.register("imagekitPath")}
              placeholder="/mobiles/samsung/galaxy-s24-ultra.jpg"
              data-testid="input-mobile-imagekit-path"
            />
          </div>
        </CardContent>
      </Card>

      {/* Short Specs */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ram">RAM</Label>
              <Input
                id="ram"
                {...form.register("shortSpecs.ram")}
                placeholder="e.g., 12GB"
                data-testid="input-mobile-ram"
              />
              {form.formState.errors.shortSpecs?.ram && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.shortSpecs.ram.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="storage">Storage</Label>
              <Input
                id="storage"
                {...form.register("shortSpecs.storage")}
                placeholder="e.g., 256GB"
                data-testid="input-mobile-storage"
              />
              {form.formState.errors.shortSpecs?.storage && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.shortSpecs.storage.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="camera">Camera</Label>
            <Input
              id="camera"
              {...form.register("shortSpecs.camera")}
              placeholder="e.g., 200MP + 50MP + 10MP + 12MP"
              data-testid="input-mobile-camera"
            />
            {form.formState.errors.shortSpecs?.camera && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.shortSpecs.camera.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="battery">Battery (Optional)</Label>
              <Input
                id="battery"
                {...form.register("shortSpecs.battery")}
                placeholder="e.g., 5000mAh"
                data-testid="input-mobile-battery"
              />
            </div>
            <div>
              <Label htmlFor="display">Display (Optional)</Label>
              <Input
                id="display"
                {...form.register("shortSpecs.display")}
                placeholder="e.g., 6.8 inches"
                data-testid="input-mobile-display"
              />
            </div>
            <div>
              <Label htmlFor="processor">Processor (Optional)</Label>
              <Input
                id="processor"
                {...form.register("shortSpecs.processor")}
                placeholder="e.g., Snapdragon 8 Gen 3"
                data-testid="input-mobile-processor"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carousel Images */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(form.formState.errors.carouselImages as any)?.message && (
            <p className="text-sm text-red-500">
              {(form.formState.errors.carouselImages as any).message}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={currentImageUrl}
              onChange={(e) => setCurrentImageUrl(e.target.value)}
              placeholder="Enter image URL or filename (e.g., mobile.png)"
              data-testid="input-carousel-url"
            />
            <Button
              type="button"
              onClick={addCarouselImage}
              data-testid="button-add-carousel-image"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {carouselFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <Input
                  value={form.watch(`carouselImages.${index}`)}
                  onChange={(e) => form.setValue(`carouselImages.${index}`, e.target.value)}
                  placeholder="Image URL"
                  data-testid={`input-carousel-image-${index}`}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeCarouselImage(index)}
                  data-testid={`button-remove-carousel-image-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Specifications</CardTitle>
            <Button
              type="button"
              onClick={addSpecificationCategory}
              data-testid="button-add-spec-category"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(form.formState.errors.specifications as any)?.message && (
            <p className="text-sm text-red-500">
              {(form.formState.errors.specifications as any).message}
            </p>
          )}
          {specFields.map((field, categoryIndex) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <Label htmlFor={`spec-category-${categoryIndex}`}>Category Name</Label>
                    <Input
                      id={`spec-category-${categoryIndex}`}
                      value={form.watch(`specifications.${categoryIndex}.category`)}
                      onChange={(e) => form.setValue(`specifications.${categoryIndex}.category`, e.target.value)}
                      placeholder="e.g., Display, Camera, Performance"
                      data-testid={`input-spec-category-${categoryIndex}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSpecification(categoryIndex)}
                    data-testid={`button-remove-spec-category-${categoryIndex}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentSpecFeature}
                    onChange={(e) => setCurrentSpecFeature(e.target.value)}
                    placeholder="Feature name"
                    data-testid={`input-spec-feature-${categoryIndex}`}
                  />
                  <Input
                    value={currentSpecValue}
                    onChange={(e) => setCurrentSpecValue(e.target.value)}
                    placeholder="Feature value"
                    data-testid={`input-spec-value-${categoryIndex}`}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpecToCategory(categoryIndex)}
                    data-testid={`button-add-spec-${categoryIndex}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {form.watch(`specifications.${categoryIndex}.specs`)?.map((spec, specIndex) => (
                    <div key={specIndex} className="flex gap-2 items-center">
                      <Input
                        value={spec.feature}
                        onChange={(e) => {
                          const category = form.getValues(`specifications.${categoryIndex}`);
                          const updatedSpecs = [...category.specs];
                          updatedSpecs[specIndex] = { ...spec, feature: e.target.value };
                          updateSpecification(categoryIndex, { ...category, specs: updatedSpecs });
                        }}
                        placeholder="Feature name"
                        data-testid={`input-edit-spec-feature-${categoryIndex}-${specIndex}`}
                      />
                      <Input
                        value={spec.value}
                        onChange={(e) => {
                          const category = form.getValues(`specifications.${categoryIndex}`);
                          const updatedSpecs = [...category.specs];
                          updatedSpecs[specIndex] = { ...spec, value: e.target.value };
                          updateSpecification(categoryIndex, { ...category, specs: updatedSpecs });
                        }}
                        placeholder="Feature value"
                        data-testid={`input-edit-spec-value-${categoryIndex}-${specIndex}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSpecFromCategory(categoryIndex, specIndex)}
                        data-testid={`button-remove-spec-${categoryIndex}-${specIndex}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Dimensions (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                {...form.register("dimensions.height")}
                placeholder="e.g., 162.3mm"
                data-testid="input-mobile-height"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                {...form.register("dimensions.width")}
                placeholder="e.g., 79.0mm"
                data-testid="input-mobile-width"
              />
            </div>
            <div>
              <Label htmlFor="thickness">Thickness</Label>
              <Input
                id="thickness"
                {...form.register("dimensions.thickness")}
                placeholder="e.g., 8.6mm"
                data-testid="input-mobile-thickness"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                {...form.register("dimensions.weight")}
                placeholder="e.g., 233g"
                data-testid="input-mobile-weight"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Build Materials (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Build Materials (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="frame">Frame</Label>
              <Input
                id="frame"
                {...form.register("buildMaterials.frame")}
                placeholder="e.g., Aluminum"
                data-testid="input-mobile-frame"
              />
            </div>
            <div>
              <Label htmlFor="back">Back</Label>
              <Input
                id="back"
                {...form.register("buildMaterials.back")}
                placeholder="e.g., Glass (Gorilla Glass Victus 2)"
                data-testid="input-mobile-back"
              />
            </div>
            <div>
              <Label htmlFor="protection">Protection</Label>
              <Input
                id="protection"
                {...form.register("buildMaterials.protection")}
                placeholder="e.g., IP68"
                data-testid="input-mobile-protection"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-save-mobile"
        >
          {mutation.isPending
            ? "Saving..."
            : mobile
              ? "Update Mobile"
              : "Create Mobile"}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        </div>
      </form>
    </div>
  );
}
