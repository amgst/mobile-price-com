import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertUsedListingSchema, usedListingConditions, type Brand } from "@shared/schema";
import { Loader2, Upload, X, Sparkles, ImagePlus } from "lucide-react";

interface AdminUsedListingFormProps {
  brands: Brand[];
  onSuccess: () => void;
}

const formSchema = insertUsedListingSchema;
type FormData = typeof formSchema._type;

interface UploadedImage {
  url: string;
  previewUrl: string;
}

export function AdminUsedListingForm({ brands, onSuccess }: AdminUsedListingFormProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: "",
      model: "",
      condition: "Good",
      price: "",
      description: "",
      city: "",
      images: [],
      sellerName: "",
      sellerPhone: "",
      sellerEmail: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Listing published" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create listing",
        description: error.message || "Please check the form and try again.",
        variant: "destructive",
      });
    },
  });

  const descriptionMutation = useMutation({
    mutationFn: async () => {
      const { brand, model, condition, price, city } = form.getValues();
      const res = await apiRequest("/api/admin/ai/listing-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, condition, price, city }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue("description", data.description, { shouldValidate: true });
    },
    onError: (error: any) => {
      toast({
        title: "AI description failed",
        description: error.message || "Could not generate a description.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDescription = () => {
    const { brand, model, condition } = form.getValues();
    if (!brand || !model || !condition) {
      toast({
        title: "Missing details",
        description: "Select a brand, model, and condition first.",
        variant: "destructive",
      });
      return;
    }
    descriptionMutation.mutate();
  };

  const handleGenerateImage = async () => {
    const { brand, model, condition } = form.getValues();
    if (!brand || !model || !condition) {
      toast({
        title: "Missing details",
        description: "Select a brand, model, and condition first.",
        variant: "destructive",
      });
      return;
    }
    if (images.length >= 6) {
      toast({ title: "Photo limit reached", description: "Remove a photo first.", variant: "destructive" });
      return;
    }

    setGeneratingImage(true);
    try {
      const res = await apiRequest("/api/admin/ai/listing-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model, condition }),
      });
      const { url } = await res.json();
      setImages((prev) => {
        const next = [...prev, { url, previewUrl: url }];
        form.setValue("images", next.map((img) => img.url), { shouldValidate: true });
        return next;
      });
    } catch (error: any) {
      toast({
        title: "AI image generation failed",
        description: error.message || "Could not generate an image.",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      toast({ title: "Too many photos", description: "You can upload up to 6 photos.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast({
            title: "Unsupported file type",
            description: `${file.name} must be JPEG, PNG, or WebP.`,
            variant: "destructive",
          });
          continue;
        }

        const signRes = await apiRequest("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        const { uploadUrl, publicUrl } = await signRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error("Photo upload failed");
        }

        setImages((prev) => {
          const next = [...prev, { url: publicUrl, previewUrl: URL.createObjectURL(file) }];
          form.setValue("images", next.map((img) => img.url), { shouldValidate: true });
          return next;
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.url !== url);
      form.setValue("images", next.map((img) => img.url), { shouldValidate: true });
      return next;
    });
  };

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="admin-listing-brand">Brand *</Label>
          <Select
            value={form.watch("brand")}
            onValueChange={(value) => form.setValue("brand", value, { shouldValidate: true })}
          >
            <SelectTrigger id="admin-listing-brand">
              <SelectValue placeholder="Select brand" />
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
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.brand.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="admin-listing-model">Model *</Label>
          <Input id="admin-listing-model" placeholder="e.g. Galaxy S23 Ultra" {...form.register("model")} />
          {form.formState.errors.model && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="admin-listing-condition">Condition *</Label>
          <Select
            value={form.watch("condition")}
            onValueChange={(value) => form.setValue("condition", value as any, { shouldValidate: true })}
          >
            <SelectTrigger id="admin-listing-condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {usedListingConditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-listing-price">Asking Price *</Label>
          <Input id="admin-listing-price" placeholder="e.g. Rs 45,000" {...form.register("price")} />
          {form.formState.errors.price && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.price.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="admin-listing-city">City</Label>
        <Input id="admin-listing-city" placeholder="e.g. Lahore" {...form.register("city")} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="admin-listing-description">Description</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerateDescription}
            disabled={descriptionMutation.isPending}
            data-testid="button-ai-generate-description"
          >
            {descriptionMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            Generate with AI
          </Button>
        </div>
        <Textarea
          id="admin-listing-description"
          rows={4}
          placeholder="Describe the phone's condition, accessories included, box/warranty status, etc."
          {...form.register("description")}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Photos * (up to 6)</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleGenerateImage}
            disabled={generatingImage || images.length >= 6}
            data-testid="button-ai-generate-image"
          >
            {generatingImage ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
            )}
            Generate Photo with AI
          </Button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {images.map((img) => (
            <div key={img.url} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={img.previewUrl} alt="Listing" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.url)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                data-testid={`button-remove-admin-image-${img.url}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary text-gray-500 hover:text-primary transition-colors">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          )}
        </div>
        {form.formState.errors.images && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.images.message as string}</p>
        )}
      </div>

      <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="admin-listing-seller-name">Seller Name *</Label>
          <Input id="admin-listing-seller-name" placeholder="Full name" {...form.register("sellerName")} />
          {form.formState.errors.sellerName && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.sellerName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="admin-listing-seller-phone">Phone Number *</Label>
          <Input id="admin-listing-seller-phone" placeholder="+92-3xx-xxxxxxx" {...form.register("sellerPhone")} />
          {form.formState.errors.sellerPhone && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.sellerPhone.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="admin-listing-seller-email">Email (optional)</Label>
        <Input id="admin-listing-seller-email" type="email" placeholder="seller@example.com" {...form.register("sellerEmail")} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending || uploading || generatingImage}>
        {submitMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...
          </>
        ) : (
          "Publish Listing"
        )}
      </Button>
    </form>
  );
}
