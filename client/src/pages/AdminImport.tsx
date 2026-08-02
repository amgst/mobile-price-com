import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Database, Link2, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { ProtectedAdmin } from '@/components/admin/protected-admin';

interface ImportStatus {
  totalBrands: number;
  totalMobiles: number;
}

interface ShortSpecs {
  ram: string;
  storage: string;
  camera: string;
  battery?: string;
  display?: string;
  processor?: string;
}

interface UrlImportDraft {
  name: string;
  slug: string;
  brand: string;
  model: string;
  releaseDate: string;
  price: string;
  pricePkr: number | null;
  ramGb: number | null;
  storageGb: number | null;
  batteryMah: number | null;
  screenInches: string | null;
  launchYear: number | null;
  imageUrl: string;
  carouselImages: string[];
  shortSpecs: ShortSpecs;
  specifications: { category: string; specs: { feature: string; value: string }[] }[];
  dimensions: { height: string; width: string; thickness: string; weight: string };
  buildMaterials: { frame: string; back: string; protection: string };
  sourceUrl: string;
  alreadyExists: boolean;
  existingId: string | null;
}

function AdminImport() {
  const [url, setUrl] = useState('');
  const [draft, setDraft] = useState<UrlImportDraft | null>(null);
  const [specsJson, setSpecsJson] = useState('');
  const [specsJsonError, setSpecsJsonError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const queryClient = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery<ImportStatus>({
    queryKey: ['/api/admin/import/status'],
  });

  const extractMutation = useMutation<UrlImportDraft, Error, string>({
    mutationFn: async (pageUrl: string) => {
      const response = await apiRequest('/api/admin/import/url', {
        method: 'POST',
        body: JSON.stringify({ url: pageUrl }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setDraft(data);
      setSpecsJson(JSON.stringify(data.specifications, null, 2));
      setSpecsJsonError('');
      setSaveMessage('');
    },
  });

  const saveMutation = useMutation<unknown, Error, UrlImportDraft>({
    mutationFn: async (d: UrlImportDraft) => {
      let specifications = d.specifications;
      try {
        specifications = JSON.parse(specsJson);
        setSpecsJsonError('');
      } catch {
        setSpecsJsonError('Specifications JSON is invalid — fix it before saving.');
        throw new Error('Invalid specifications JSON');
      }

      const payload = {
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        model: d.model,
        imageUrl: d.imageUrl,
        releaseDate: d.releaseDate || new Date().toISOString().slice(0, 10),
        price: d.price || null,
        pricePkr: d.pricePkr,
        ramGb: d.ramGb,
        storageGb: d.storageGb,
        batteryMah: d.batteryMah,
        screenInches: d.screenInches,
        launchYear: d.launchYear,
        shortSpecs: d.shortSpecs,
        carouselImages: d.carouselImages.length > 0 ? d.carouselImages : [d.imageUrl].filter(Boolean),
        specifications,
        dimensions: d.dimensions,
        buildMaterials: d.buildMaterials,
      };

      const endpoint = d.existingId ? `/api/admin/mobiles/${d.existingId}` : '/api/admin/mobiles';
      const response = await apiRequest(endpoint, {
        method: d.existingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      setSaveMessage(draft?.existingId ? 'Mobile updated successfully.' : 'Mobile saved to database.');
      setDraft(null);
      setUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    },
  });

  const updateDraft = (patch: Partial<UrlImportDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateShortSpec = (key: keyof ShortSpecs, value: string) => {
    setDraft((prev) => (prev ? { ...prev, shortSpecs: { ...prev.shortSpecs, [key]: value } } : prev));
  };

  const numOrNull = (value: string) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return (
    <ProtectedAdmin>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Mobile from URL</h1>
          <p className="text-muted-foreground">
            Paste a link to any phone's specification page. The specs are extracted automatically,
            and you review and edit everything before it is saved.
          </p>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading status...</span>
              </div>
            ) : status ? (
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{status.totalBrands}</div>
                  <div className="text-sm text-muted-foreground">Brands</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{status.totalMobiles}</div>
                  <div className="text-sm text-muted-foreground">Mobiles</div>
                </div>
              </div>
            ) : (
              <div>Unable to load status</div>
            )}
          </CardContent>
        </Card>

        {/* URL Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Source Page URL
            </CardTitle>
            <CardDescription>
              Works best with pages that show a full specification table (spec/review sites, brand product pages).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/phones/samsung-galaxy-s24-ultra"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim()) extractMutation.mutate(url.trim());
                }}
              />
              <Button
                onClick={() => extractMutation.mutate(url.trim())}
                disabled={extractMutation.isPending || !url.trim()}
              >
                {extractMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fetch &amp; Extract
              </Button>
            </div>
            {extractMutation.isPending && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Fetching page and extracting specifications with AI...</AlertDescription>
              </Alert>
            )}
            {extractMutation.isError && (
              <Alert className="border-red-500">
                <AlertDescription className="text-red-600">{extractMutation.error.message}</AlertDescription>
              </Alert>
            )}
            {saveMessage && (
              <Alert className="border-green-500">
                <AlertDescription className="text-green-700">{saveMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Draft Review */}
        {draft && (
          <Card>
            <CardHeader>
              <CardTitle>Review Extracted Data</CardTitle>
              <CardDescription>
                Check every field before saving — the AI only fills in what the page actually states.
              </CardDescription>
              {draft.alreadyExists && (
                <Alert className="border-yellow-500 mt-2">
                  <AlertDescription>
                    This phone already exists in the database. Saving will <strong>update</strong> the existing entry.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Brand (slug)</Label>
                  <Input value={draft.brand} onChange={(e) => updateDraft({ brand: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={draft.model} onChange={(e) => updateDraft({ model: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={draft.slug} onChange={(e) => updateDraft({ slug: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Release Date (YYYY-MM-DD)</Label>
                  <Input value={draft.releaseDate} onChange={(e) => updateDraft({ releaseDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price (display text)</Label>
                  <Input value={draft.price} onChange={(e) => updateDraft({ price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Price PKR (number)</Label>
                  <Input
                    type="number"
                    value={draft.pricePkr ?? ''}
                    onChange={(e) => updateDraft({ pricePkr: numOrNull(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RAM (GB)</Label>
                  <Input
                    type="number"
                    value={draft.ramGb ?? ''}
                    onChange={(e) => updateDraft({ ramGb: numOrNull(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage (GB)</Label>
                  <Input
                    type="number"
                    value={draft.storageGb ?? ''}
                    onChange={(e) => updateDraft({ storageGb: numOrNull(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Battery (mAh)</Label>
                  <Input
                    type="number"
                    value={draft.batteryMah ?? ''}
                    onChange={(e) => updateDraft({ batteryMah: numOrNull(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Screen (inches)</Label>
                  <Input
                    value={draft.screenInches ?? ''}
                    onChange={(e) => updateDraft({ screenInches: e.target.value || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Launch Year</Label>
                  <Input
                    type="number"
                    value={draft.launchYear ?? ''}
                    onChange={(e) => updateDraft({ launchYear: numOrNull(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Specs</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(['ram', 'storage', 'camera', 'battery', 'display', 'processor'] as const).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground capitalize">{key}</Label>
                      <Input
                        value={draft.shortSpecs[key] ?? ''}
                        onChange={(e) => updateShortSpec(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Main Image URL</Label>
                <Input value={draft.imageUrl} onChange={(e) => updateDraft({ imageUrl: e.target.value })} />
                {draft.carouselImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {draft.carouselImages.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => updateDraft({ imageUrl: img })}
                        className={`border-2 rounded p-1 ${draft.imageUrl === img ? 'border-blue-500' : 'border-transparent'}`}
                        title="Use as main image"
                      >
                        <img src={img} alt="" className="h-20 w-16 object-contain" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Specifications (JSON — edit if needed)</Label>
                <Textarea
                  value={specsJson}
                  onChange={(e) => setSpecsJson(e.target.value)}
                  rows={14}
                  className="font-mono text-xs"
                />
                {specsJsonError && <p className="text-sm text-red-600">{specsJsonError}</p>}
              </div>

              <div className="text-xs text-muted-foreground">
                Source: <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="underline">{draft.sourceUrl}</a>
              </div>

              {saveMutation.isError && !specsJsonError && (
                <Alert className="border-red-500">
                  <AlertDescription className="text-red-600">{saveMutation.error.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => saveMutation.mutate(draft)}
                  disabled={saveMutation.isPending || !draft.name || !draft.brand || !draft.imageUrl}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {draft.existingId ? 'Update Existing Mobile' : 'Save to Database'}
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)} disabled={saveMutation.isPending}>
                  Discard
                </Button>
              </div>
              {!draft.imageUrl && (
                <p className="text-sm text-yellow-600">
                  A main image URL is required before saving — pick one above or paste one in.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedAdmin>
  );
}

export default AdminImport;
