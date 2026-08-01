import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUsedListingSchema, usedListingConditions, type Brand } from "@shared/schema";
import { Loader2, Upload, X, Tag } from "lucide-react";

const formSchema = insertUsedListingSchema;
type FormData = typeof formSchema._type;

interface UploadedImage {
  url: string;
  previewUrl: string;
}

function SellPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });

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
      const res = await apiRequest("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing submitted",
        description: "Your phone has been submitted for review. It will appear on the site once approved.",
      });
      navigate("/used-phones");
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Please check the form and try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      toast({
        title: "Too many photos",
        description: "You can upload up to 6 photos.",
        variant: "destructive",
      });
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
        description: error.message || "Could not upload photo. Photo storage may not be configured yet.",
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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Sell Your Mobile | MobilePrices.pk</title>
        <meta
          name="description"
          content="List your used mobile phone for sale for free. Reach thousands of buyers on MobilePrices.pk."
        />
      </Helmet>

      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sell Your Mobile</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            List your used phone for free. Submissions are reviewed before going live, usually within 24 hours.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Phone Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand *</Label>
                  <Select
                    value={form.watch("brand")}
                    onValueChange={(value) => form.setValue("brand", value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="brand">
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
                  <Label htmlFor="model">Model *</Label>
                  <Input id="model" placeholder="e.g. Galaxy S23 Ultra" {...form.register("model")} />
                  {form.formState.errors.model && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.model.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={form.watch("condition")}
                    onValueChange={(value) => form.setValue("condition", value as any, { shouldValidate: true })}
                  >
                    <SelectTrigger id="condition">
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
                  <Label htmlFor="price">Asking Price *</Label>
                  <Input id="price" placeholder="e.g. Rs 45,000" {...form.register("price")} />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="e.g. Lahore" {...form.register("city")} />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the phone's condition, accessories included, box/warranty status, etc."
                  {...form.register("description")}
                />
              </div>

              <div>
                <Label>Photos * (up to 6)</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                  {images.map((img) => (
                    <div key={img.url} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={img.previewUrl} alt="Listing" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.url)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                        data-testid={`button-remove-image-${img.url}`}
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
                  <Label htmlFor="sellerName">Your Name *</Label>
                  <Input id="sellerName" placeholder="Full name" {...form.register("sellerName")} />
                  {form.formState.errors.sellerName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.sellerName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sellerPhone">Phone Number *</Label>
                  <Input id="sellerPhone" placeholder="+92-3xx-xxxxxxx" {...form.register("sellerPhone")} />
                  {form.formState.errors.sellerPhone && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.sellerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sellerEmail">Email (optional)</Label>
                <Input id="sellerEmail" type="email" placeholder="you@example.com" {...form.register("sellerEmail")} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending || uploading}>
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Listing for Review"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

export default SellPage;
