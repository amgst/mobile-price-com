import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { Plus, Edit, Trash2, Eye, Download } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminMobileForm } from "@/components/admin/AdminMobileForm";
import { AdminBrandForm } from "@/components/admin/AdminBrandForm";
import { ProtectedAdmin } from "@/components/admin/protected-admin";
import type { Mobile, Brand } from "@shared/schema";

export default function Admin() {
  const [selectedMobile, setSelectedMobile] = useState<Mobile | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mobiles = [], isLoading: mobilesLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const deleteMobileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/mobiles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobiles"] });
      toast({
        title: "Success",
        description: "Mobile deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete mobile",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/brands/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete brand",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMobile = async (mobile: Mobile) => {
    if (window.confirm(`Are you sure you want to delete ${mobile.name}?`)) {
      deleteMobileMutation.mutate(mobile.id);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (window.confirm(`Are you sure you want to delete ${brand.name}?`)) {
      deleteBrandMutation.mutate(brand.id);
    }
  };

  const handleEditMobile = (mobile: Mobile) => {
    setSelectedMobile(mobile);
    setShowMobileForm(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowBrandForm(true);
  };

  const handleViewMobile = (mobile: Mobile) => {
    setSelectedMobile(mobile);
    setShowMobileDetails(true);
  };

  const handleAddMobile = () => {
    setSelectedMobile(null);
    setShowMobileForm(true);
  };

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setShowBrandForm(true);
  };

  return (
    <ProtectedAdmin>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mobile Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage mobile phones and brands for your comparison website
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/import">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </Link>
            <Link href="/export">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Database
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="mobiles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mobiles" data-testid="tab-mobiles">Mobiles</TabsTrigger>
            <TabsTrigger value="brands" data-testid="tab-brands">Brands</TabsTrigger>
          </TabsList>

          {/* Mobiles Tab */}
          <TabsContent value="mobiles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Mobile Phones</h2>
              <Button onClick={handleAddMobile} data-testid="button-add-mobile">
                <Plus className="w-4 h-4 mr-2" />
                Add Mobile
              </Button>
            </div>

            {mobilesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mobiles.map((mobile) => (
                  <Card key={mobile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{mobile.name}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {mobile.brand}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <SafeImage
                        src={mobile.imageUrl}
                        alt={mobile.name}
                        className="w-full h-32 object-cover rounded-md mb-4"
                        loading="lazy"
                      />
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>RAM:</strong> {mobile.shortSpecs.ram}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Storage:</strong> {mobile.shortSpecs.storage}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Price:</strong> {mobile.price || "Not set"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMobile(mobile)}
                          data-testid={`button-view-mobile-${mobile.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMobile(mobile)}
                          data-testid={`button-edit-mobile-${mobile.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMobile(mobile)}
                          disabled={deleteMobileMutation.isPending}
                          data-testid={`button-delete-mobile-${mobile.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Brands</h2>
              <Button onClick={handleAddBrand} data-testid="button-add-brand">
                <Plus className="w-4 h-4 mr-2" />
                Add Brand
              </Button>
            </div>

            {brandsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brands.map((brand) => (
                  <Card key={brand.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {brand.logo || brand.name.charAt(0)}
                        </div>
                        {brand.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {brand.phoneCount} phones
                        </Badge>
                        <Badge variant={brand.isVisible !== false ? "default" : "destructive"}>
                          {brand.isVisible !== false ? "Visible" : "Hidden"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {brand.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBrand(brand)}
                          data-testid={`button-edit-brand-${brand.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBrand(brand)}
                          disabled={deleteBrandMutation.isPending}
                          data-testid={`button-delete-brand-${brand.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mobile Form Dialog */}
        <Dialog open={showMobileForm} onOpenChange={setShowMobileForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedMobile ? "Edit Mobile" : "Add New Mobile"}
              </DialogTitle>
            </DialogHeader>
            <AdminMobileForm
              mobile={selectedMobile}
              brands={brands}
              onSuccess={() => {
                setShowMobileForm(false);
                setSelectedMobile(null);
                queryClient.invalidateQueries({ queryKey: ["/api/mobiles"] });
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Brand Form Dialog */}
        <Dialog open={showBrandForm} onOpenChange={setShowBrandForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedBrand ? "Edit Brand" : "Add New Brand"}
              </DialogTitle>
            </DialogHeader>
            <AdminBrandForm
              brand={selectedBrand}
              onSuccess={() => {
                setShowBrandForm(false);
                setSelectedBrand(null);
                queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Mobile Details Dialog */}
        <Dialog open={showMobileDetails} onOpenChange={setShowMobileDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMobile?.name}</DialogTitle>
            </DialogHeader>
            {selectedMobile && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SafeImage
                      src={selectedMobile.imageUrl}
                      alt={selectedMobile.name}
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Basic Info</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Brand:</strong> {selectedMobile.brand}</p>
                        <p><strong>Model:</strong> {selectedMobile.model}</p>
                        <p><strong>Price:</strong> {selectedMobile.price || "Not set"}</p>
                        <p><strong>Release Date:</strong> {selectedMobile.releaseDate}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Quick Specs</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>RAM:</strong> {selectedMobile.shortSpecs.ram}</p>
                        <p><strong>Storage:</strong> {selectedMobile.shortSpecs.storage}</p>
                        <p><strong>Camera:</strong> <span dangerouslySetInnerHTML={{ __html: selectedMobile.shortSpecs.camera }} /></p>
                        {selectedMobile.shortSpecs.battery && (
                          <p><strong>Battery:</strong> {selectedMobile.shortSpecs.battery}</p>
                        )}
                        {selectedMobile.shortSpecs.display && (
                          <p><strong>Display:</strong> <span dangerouslySetInnerHTML={{ __html: selectedMobile.shortSpecs.display }} /></p>
                        )}
                        {selectedMobile.shortSpecs.processor && (
                          <p><strong>Processor:</strong> {selectedMobile.shortSpecs.processor}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedMobile.specifications && selectedMobile.specifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Detailed Specifications</h3>
                    <div className="space-y-4">
                      {selectedMobile.specifications.map((category, index) => (
                        <div key={index}>
                          <h4 className="font-medium text-primary mb-2">{category.category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {category.specs.map((spec, specIndex) => (
                              <div key={specIndex} className="flex justify-between border-b pb-1">
                                <span className="text-gray-600 dark:text-gray-400">{spec.feature}</span>
                                <span dangerouslySetInnerHTML={{ __html: spec.value }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedAdmin>
  );
}