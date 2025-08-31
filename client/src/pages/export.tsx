import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SEOHead } from "@/components/seo/seo-head";
import { ProtectedAdmin } from "@/components/admin/protected-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Database, BarChart3, Loader2 } from "lucide-react";

interface ExportStats {
  totalBrands: number;
  totalMobiles: number;
  brandDistribution: Record<string, number>;
  priceDistribution: Record<string, number>;
  lastUpdated: string;
  availableFormats: string[];
}

export default function Export() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery<ExportStats>({
    queryKey: ["/api/export/stats"],
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Admin", href: "/admin" },
    { label: "Database Export", href: "/export", isActive: true }
  ];

  const handleDownload = async (format: string, type?: string) => {
    const downloadKey = type ? `${format}-${type}` : format;
    setDownloading(downloadKey);
    
    try {
      let url = '';
      let filename = '';
      
      if (format === 'json') {
        url = '/api/export/json';
        filename = `mobileprices-db-${new Date().toISOString().split('T')[0]}.json`;
      } else if (format === 'csv' && type === 'brands') {
        url = '/api/export/brands/csv';
        filename = `brands-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'csv' && type === 'mobiles') {
        url = '/api/export/mobiles/csv';
        filename = `mobiles-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'sql') {
        url = '/api/export/sql';
        filename = `mobileprices-backup-${new Date().toISOString().split('T')[0]}.sql`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <SEOHead 
        title="Database Export - Admin Panel"
        description="Export and backup mobile phone database in multiple formats including JSON, CSV, and SQL."
        canonical="/export"
        noIndex={true}
      />
      
      <ProtectedAdmin>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Export</h1>
            <p className="text-lg text-gray-600">
              Export and backup your mobile phone database in multiple formats.
            </p>
          </div>

          {/* Statistics Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Brands</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalBrands}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Mobiles</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalMobiles}</p>
                    </div>
                    <Database className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available Formats</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.availableFormats.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm font-bold text-orange-600">
                        {new Date(stats.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <Download className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Full Database JSON */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Complete Database (JSON)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Export the complete database including all brands, mobiles, and metadata in JSON format.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Complete Data</Badge>
                  <Badge variant="secondary">JSON Format</Badge>
                  <Badge variant="secondary">Import Ready</Badge>
                </div>
                <Button 
                  className="w-full flex items-center gap-2"
                  onClick={() => handleDownload('json')}
                  disabled={downloading === 'json'}
                >
                  {downloading === 'json' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download JSON
                </Button>
              </CardContent>
            </Card>

            {/* Brands CSV */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Brands Data (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Export all brand information in CSV format for spreadsheet analysis.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Brands Only</Badge>
                  <Badge variant="secondary">CSV Format</Badge>
                  <Badge variant="secondary">Excel Ready</Badge>
                </div>
                <Button 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={() => handleDownload('csv', 'brands')}
                  disabled={downloading === 'csv-brands'}
                >
                  {downloading === 'csv-brands' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download CSV
                </Button>
              </CardContent>
            </Card>

            {/* Mobiles CSV */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Mobiles Data (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Export all mobile phone data with specifications in CSV format.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Mobiles Only</Badge>
                  <Badge variant="secondary">CSV Format</Badge>
                  <Badge variant="secondary">Flattened Specs</Badge>
                </div>
                <Button 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={() => handleDownload('csv', 'mobiles')}
                  disabled={downloading === 'csv-mobiles'}
                >
                  {downloading === 'csv-mobiles' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download CSV
                </Button>
              </CardContent>
            </Card>

            {/* SQL Backup */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-red-600" />
                  PostgreSQL Backup (SQL)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generate a complete SQL backup file that can be used to restore the entire database on any PostgreSQL instance.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Complete Backup</Badge>
                  <Badge variant="secondary">PostgreSQL Compatible</Badge>
                  <Badge variant="secondary">Production Ready</Badge>
                  <Badge variant="destructive">Full Restore</Badge>
                </div>
                <Button 
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('sql')}
                  disabled={downloading === 'sql'}
                >
                  {downloading === 'sql' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download SQL Backup
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Data Distribution */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brand Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.brandDistribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([brand, count]) => (
                      <div key={brand} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{brand}</span>
                        <Badge variant="secondary">{count} phones</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Price Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Range Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.priceDistribution).map(([range, count]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          {range === 'under25k' ? 'Under ₨25,000' :
                           range === '25k-50k' ? '₨25,000 - ₨50,000' :
                           range === '50k-100k' ? '₨50,000 - ₨100,000' :
                           range === '100k-150k' ? '₨100,000 - ₨150,000' :
                           'Above ₨150,000'}
                        </span>
                        <Badge variant="secondary">{count} phones</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </ProtectedAdmin>
    </>
  );
}