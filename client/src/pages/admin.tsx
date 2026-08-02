import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye, Download, Search, Check, X, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminMobileForm } from "@/components/admin/AdminMobileForm";
import { AdminBrandForm } from "@/components/admin/AdminBrandForm";
import { AdminUsedListingForm } from "@/components/admin/AdminUsedListingForm";
import { ProtectedAdmin } from "@/components/admin/protected-admin";
import type { Mobile, Brand, UsedListing } from "@shared/schema";

export default function Admin() {
  const [selectedMobile, setSelectedMobile] = useState<Mobile | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();



  const { data: mobiles = [], isLoading: mobilesLoading } = useQuery<Mobile[]>({
    queryKey: ["/api/mobiles"],
  });

  const filteredMobiles = useMemo(() => {
    if (!searchQuery.trim()) return mobiles;
    
    const query = searchQuery.toLowerCase();
    return mobiles.filter(mobile => 
      mobile.name?.toLowerCase().includes(query) ||
      mobile.brand?.toLowerCase().includes(query) ||
      mobile.model?.toLowerCase().includes(query)
    );
  }, [mobiles, searchQuery]);

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery<UsedListing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const pendingListingsCount = useMemo(
    () => listings.filter((listing) => listing.status === "pending").length,
    [listings]
  );

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

  const updateListingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Success", description: "Listing status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update listing", variant: "destructive" });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/listings/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Success", description: "Listing deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    },
  });

  const handleDeleteListing = (listing: UsedListing) => {
    if (window.confirm(`Delete listing for ${listing.brand} ${listing.model}?`)) {
      deleteListingMutation.mutate(listing.id);
    }
  };

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
            <Link href="/admin">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary cursor-pointer">
                Mobile Price Admin
              </h1>
            </Link>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mobiles" data-testid="tab-mobiles">Mobiles</TabsTrigger>
            <TabsTrigger value="brands" data-testid="tab-brands">Brands</TabsTrigger>
            <TabsTrigger value="listings" data-testid="tab-listings">
              Used Listings
              {pendingListingsCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingListingsCount}</Badge>
              )}
            </TabsTrigger>
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
            
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search mobiles by name, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {filteredMobiles.length > 0 ? (
                    <>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMobiles.length)} - {Math.min(currentPage * itemsPerPage, filteredMobiles.length)} of {filteredMobiles.length} mobiles
                    {searchQuery && ` (filtered from ${mobiles.length} total)`}</>
                  ) : (
                    searchQuery ? `No mobiles found matching "${searchQuery}"` : 'No mobiles available'
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMobiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((mobile) => (
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
                          <a
                            href={`/${mobile.brand}/${mobile.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-view-mobile-${mobile.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </a>
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
                {Math.ceil(filteredMobiles.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {currentPage} of {Math.ceil(filteredMobiles.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredMobiles.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredMobiles.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
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
                        <a
                          href={`/${brand.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                          title={`View ${brand.name} phones`}
                        >
                          {brand.name}
                        </a>
                      </CardTitle>
                      <div className="flex gap-2">
                        <a href={`/${brand.slug}`} target="_blank" rel="noreferrer">
                          <Badge variant="secondary" className="hover:bg-secondary/80">
                            {brand.phoneCount || 0} phones
                          </Badge>
                        </a>
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

          {/* Used Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Used Phone Listings</h2>
              <Button onClick={() => setShowListingForm(true)} data-testid="button-add-listing">
                <Plus className="w-4 h-4 mr-2" />
                Add Listing
              </Button>
            </div>

            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  No submissions yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start justify-between gap-2">
                        <span>{listing.brand} {listing.model}</span>
                        <Badge
                          variant={
                            listing.status === "approved"
                              ? "default"
                              : listing.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {listing.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SafeImage
                        src={listing.images}
                        alt={`${listing.brand} ${listing.model}`}
                        className="w-full h-32 object-cover rounded-md mb-4"
                        loading="lazy"
                      />
                      <div className="space-y-1 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Price:</strong> {listing.price}</p>
                        <p><strong>Condition:</strong> {listing.condition}</p>
                        {listing.city && (
                          <p className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{listing.city}</p>
                        )}
                        <p className="flex items-center"><Phone className="w-3 h-3 mr-1" />{listing.sellerName} - {listing.sellerPhone}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {listing.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateListingStatusMutation.mutate({ id: listing.id, status: "approved" })}
                            disabled={updateListingStatusMutation.isPending}
                            data-testid={`button-approve-listing-${listing.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        )}
                        {listing.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateListingStatusMutation.mutate({ id: listing.id, status: "rejected" })}
                            disabled={updateListingStatusMutation.isPending}
                            data-testid={`button-reject-listing-${listing.id}`}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        )}
                        {listing.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateListingStatusMutation.mutate({ id: listing.id, status: "sold" })}
                            disabled={updateListingStatusMutation.isPending}
                            data-testid={`button-sold-listing-${listing.id}`}
                          >
                            Mark Sold
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteListing(listing)}
                          disabled={deleteListingMutation.isPending}
                          data-testid={`button-delete-listing-${listing.id}`}
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

        {/* Used Listing Form Dialog */}
        <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Listing</DialogTitle>
            </DialogHeader>
            <AdminUsedListingForm
              brands={brands}
              onSuccess={() => {
                setShowListingForm(false);
                queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
                queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
              }}
            />
          </DialogContent>
        </Dialog>

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

      </div>
    </ProtectedAdmin>
  );
}