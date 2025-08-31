import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertBrandSchema } from "@shared/schema";
import { z } from "zod";
import type { Brand } from "@shared/schema";

interface AdminBrandFormProps {
  brand?: Brand | null;
  onSuccess: () => void;
}

type FormData = z.infer<typeof insertBrandSchema>;

export function AdminBrandForm({ brand, onSuccess }: AdminBrandFormProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertBrandSchema),
    defaultValues: brand ? {
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      phoneCount: brand.phoneCount || "",
      description: brand.description || "",
      isVisible: brand.isVisible !== false,
    } : {
      name: "",
      slug: "",
      logo: "",
      phoneCount: "",
      description: "",
      isVisible: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const cleanData = {
        ...data,
        logo: data.logo || null,
        phoneCount: data.phoneCount || null,
        description: data.description || null,
      };

      if (brand) {
        return await apiRequest(`/api/admin/brands/${brand.id}`, {
          method: "PUT",
          body: JSON.stringify(cleanData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return await apiRequest("/api/admin/brands", {
          method: "POST",
          body: JSON.stringify(cleanData),
          headers: { "Content-Type": "application/json" },
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Brand ${brand ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${brand ? "update" : "create"} brand`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., Samsung"
              data-testid="input-brand-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...form.register("slug")}
              placeholder="e.g., samsung"
              data-testid="input-brand-slug"
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo">Logo (Optional)</Label>
              <Input
                id="logo"
                {...form.register("logo")}
                placeholder="e.g., S or URL to logo"
                data-testid="input-brand-logo"
              />
            </div>
            <div>
              <Label htmlFor="phoneCount">Phone Count (Optional)</Label>
              <Input
                id="phoneCount"
                {...form.register("phoneCount")}
                placeholder="e.g., 142"
                data-testid="input-brand-phone-count"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="e.g., South Korean multinational electronics company"
              rows={3}
              data-testid="input-brand-description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isVisible"
              checked={form.watch("isVisible") || false}
              onCheckedChange={(checked) => form.setValue("isVisible", checked)}
              data-testid="switch-brand-visibility"
            />
            <Label htmlFor="isVisible" className="text-sm font-medium">
              Brand Visible on Website
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-save-brand"
        >
          {mutation.isPending
            ? "Saving..."
            : brand
              ? "Update Brand"
              : "Create Brand"}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  );
}