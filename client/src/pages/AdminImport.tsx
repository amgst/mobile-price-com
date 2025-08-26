import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Database, Search, TrendingUp, Building } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { ProtectedAdmin } from '@/components/admin/protected-admin';

interface ImportResult {
  success: number;
  errors: string[];
  existing?: number;
  processed?: number;
}

interface ImportStatus {
  totalBrands: number;
  totalMobiles: number;
  lastImport: string;
}

function AdminImport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [brandName, setBrandName] = useState('');
  const [importLimit, setImportLimit] = useState(50);

  const queryClient = useQueryClient();

  // Get import status
  const { data: status, isLoading: statusLoading } = useQuery<ImportStatus>({
    queryKey: ['/api/admin/import/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Import mutations
  const importLatestMutation = useMutation<ImportResult, Error, number>({
    mutationFn: async (limit: number) => {
      const response = await apiRequest(`/api/admin/import/latest?limit=${limit}`, { method: 'POST' });
      return response as ImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    }
  });

  const importBrandsMutation = useMutation<ImportResult, Error, void>({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/import/brands', { method: 'POST' });
      return response as ImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
    }
  });

  const importPopularMutation = useMutation<ImportResult, Error, void>({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/import/popular', { method: 'POST' });
      return response as ImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    }
  });

  const importBrandMutation = useMutation<ImportResult, Error, { brand: string; limit: number }>({
    mutationFn: async ({ brand, limit }) => {
      const response = await apiRequest(`/api/admin/import/brand/${encodeURIComponent(brand)}?limit=${limit}`, { method: 'POST' });
      return response as ImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    }
  });

  const searchImportMutation = useMutation<ImportResult, Error, { query: string; limit: number }>({
    mutationFn: async ({ query, limit }) => {
      const response = await apiRequest('/api/admin/import/search', { 
        method: 'POST',
        body: JSON.stringify({ query, limit }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response as ImportResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    }
  });

  const renderImportResult = (result: ImportResult | undefined, isLoading: boolean, title: string) => {
    if (isLoading) {
      return (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Importing {title.toLowerCase()}...</AlertDescription>
        </Alert>
      );
    }

    if (result) {
      const errors = result.errors || [];
      const hasNewImports = (result.success || 0) > 0;
      const hasExisting = (result.existing || 0) > 0;
      const processed = result.processed || result.success || 0;
      
      return (
        <Alert className={errors.length > 0 ? "border-yellow-500" : hasNewImports ? "border-green-500" : "border-blue-500"}>
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {hasNewImports && (
                  <Badge variant="default" className="bg-green-600">{result.success} new imported</Badge>
                )}
                {hasExisting && (
                  <Badge variant="secondary">{result.existing} already existed</Badge>
                )}
                {processed > 0 && !hasNewImports && !hasExisting && (
                  <Badge variant="secondary">{processed} processed</Badge>
                )}
                {errors.length > 0 && (
                  <Badge variant="destructive">{errors.length} errors</Badge>
                )}
                {!hasNewImports && !hasExisting && processed === 0 && errors.length === 0 && (
                  <Badge variant="outline">No items found</Badge>
                )}
              </div>
              {errors.length > 0 && (
                <div className="text-sm text-red-600 max-h-32 overflow-y-auto">
                  {errors.slice(0, 3).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {errors.length > 3 && (
                    <div>... and {errors.length - 3} more errors</div>
                  )}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <ProtectedAdmin>
      <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Import Management</h1>
          <p className="text-muted-foreground">Import real mobile data from GSMArena via RapidAPI</p>
        </div>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>Current data statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading status...</span>
            </div>
          ) : status ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status.totalBrands}</div>
                <div className="text-sm text-muted-foreground">Brands</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status.totalMobiles}</div>
                <div className="text-sm text-muted-foreground">Mobiles</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Last Import</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(status.lastImport).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div>Unable to load status</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Mobiles Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Import Latest Mobiles
            </CardTitle>
            <CardDescription>
              Import the newest mobile phones from GSMArena
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="importLimit">Number of mobiles to import</Label>
              <Input
                id="importLimit"
                type="number"
                value={importLimit}
                onChange={(e) => setImportLimit(parseInt(e.target.value) || 50)}
                min="1"
                max="100"
              />
            </div>
            <Button
              onClick={() => importLatestMutation.mutate(importLimit)}
              disabled={importLatestMutation.isPending}
              className="w-full"
            >
              {importLatestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Latest {importLimit} Mobiles
            </Button>
            {renderImportResult(importLatestMutation.data, importLatestMutation.isPending, 'Latest Mobiles')}
          </CardContent>
        </Card>

        {/* Import Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Import Brands
            </CardTitle>
            <CardDescription>
              Import all mobile phone brands and their information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => importBrandsMutation.mutate()}
              disabled={importBrandsMutation.isPending}
              className="w-full"
            >
              {importBrandsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import All Brands
            </Button>
            {renderImportResult(importBrandsMutation.data, importBrandsMutation.isPending, 'Brands')}
          </CardContent>
        </Card>

        {/* Import Popular Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Import Popular Brands
            </CardTitle>
            <CardDescription>
              Import mobiles from popular brands (Apple, Samsung, Xiaomi, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => importPopularMutation.mutate()}
              disabled={importPopularMutation.isPending}
              className="w-full"
            >
              {importPopularMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Popular Brands
            </Button>
            {renderImportResult(importPopularMutation.data, importPopularMutation.isPending, 'Popular Brands')}
          </CardContent>
        </Card>

        {/* Search and Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Import
            </CardTitle>
            <CardDescription>
              Search for specific mobiles and import them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchQuery">Search query</Label>
              <Input
                id="searchQuery"
                placeholder="e.g., iPhone 15, Galaxy S24, OnePlus"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => searchImportMutation.mutate({ query: searchQuery, limit: 10 })}
              disabled={searchImportMutation.isPending || !searchQuery.trim()}
              className="w-full"
            >
              {searchImportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search & Import
            </Button>
            {renderImportResult(searchImportMutation.data, searchImportMutation.isPending, 'Search Results')}
          </CardContent>
        </Card>
      </div>

      {/* Brand-Specific Import */}
      <Card>
        <CardHeader>
          <CardTitle>Brand-Specific Import</CardTitle>
          <CardDescription>
            Import mobiles from a specific brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand name</Label>
              <Input
                id="brandName"
                placeholder="e.g., Apple, Samsung, Xiaomi"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandLimit">Limit</Label>
              <Input
                id="brandLimit"
                type="number"
                defaultValue="20"
                min="1"
                max="50"
              />
            </div>
          </div>
          <Button
            onClick={() => importBrandMutation.mutate({ brand: brandName, limit: 20 })}
            disabled={importBrandMutation.isPending || !brandName.trim()}
            className="w-full"
          >
            {importBrandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {brandName} Mobiles
          </Button>
          {renderImportResult(importBrandMutation.data, importBrandMutation.isPending, `${brandName} Mobiles`)}
        </CardContent>
      </Card>
      </div>
    </ProtectedAdmin>
  );
}

export default AdminImport;

