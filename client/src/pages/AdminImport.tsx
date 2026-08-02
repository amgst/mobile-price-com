import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Link2, Save, Plus, Trash2, Star } from 'lucide-react';
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

interface SpecCategory {
  category: string;
  specs: { feature: string; value: string }[];
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
  specifications: SpecCategory[];
  dimensions: { height: string; width: string; thickness: string; weight: string };
  buildMaterials: { frame: string; back: string; protection: string };
  sourceUrl: string;
  alreadyExists: boolean;
  existingId: string | null;
}

function AdminImport() {
  const [url, setUrl] = useState('');
  const [draft, setDraft] = useState<UrlImportDraft | null>(null);
  // Image URLs the admin wants to keep in the phone's gallery (mirrored to R2 on save)
  const [galleryPicks, setGalleryPicks] = useState<string[]>([]);
  const [saveStage, setSaveStage] = useState<'idle' | 'copying-images' | 'saving'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

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
      setGalleryPicks(data.imageUrl ? [data.imageUrl] : []);
      setSaveMessage('');
      setSaveError('');
    },
  });

  const handleSave = async () => {
    if (!draft) return;
    setSaveError('');
    setSaveMessage('');

    try {
      // 1) Copy the chosen images to our own R2 storage so we never depend on
      //    the source site's images staying online.
      setSaveStage('copying-images');
      const wanted = Array.from(new Set([draft.imageUrl, ...galleryPicks].filter(Boolean)));
      let mainImage = draft.imageUrl;
      let gallery = wanted;

      const mirrorResponse = await apiRequest('/api/admin/import/mirror-images', {
        method: 'POST',
        body: JSON.stringify({ urls: wanted }),
        headers: { 'Content-Type': 'application/json' },
      });
      const { mirrored } = (await mirrorResponse.json()) as {
        mirrored: { source: string; url: string }[];
      };
      const map = new Map(mirrored.map((m) => [m.source, m.url]));
      mainImage = map.get(draft.imageUrl) || draft.imageUrl;
      gallery = wanted.map((u) => map.get(u) || u);

      // 2) Save the mobile itself.
      setSaveStage('saving');
      const payload = {
        slug: draft.slug,
        name: draft.name,
        brand: draft.brand,
        model: draft.model,
        imageUrl: mainImage,
        releaseDate: draft.releaseDate || new Date().toISOString().slice(0, 10),
        price: draft.price || null,
        pricePkr: draft.pricePkr,
        ramGb: draft.ramGb,
        storageGb: draft.storageGb,
        batteryMah: draft.batteryMah,
        screenInches: draft.screenInches,
        launchYear: draft.launchYear,
        shortSpecs: draft.shortSpecs,
        carouselImages: gallery.length > 0 ? gallery : [mainImage].filter(Boolean),
        specifications: draft.specifications,
        dimensions: draft.dimensions,
        buildMaterials: draft.buildMaterials,
      };

      const endpoint = draft.existingId ? `/api/admin/mobiles/${draft.existingId}` : '/api/admin/mobiles';
      await apiRequest(endpoint, {
        method: draft.existingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      setSaveMessage(
        draft.existingId
          ? 'Mobile updated — images copied to our storage.'
          : 'Mobile saved — images copied to our storage.'
      );
      setDraft(null);
      setUrl('');
      setGalleryPicks([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/import/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobiles'] });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaveStage('idle');
    }
  };

  const updateDraft = (patch: Partial<UrlImportDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateShortSpec = (key: keyof ShortSpecs, value: string) => {
    setDraft((prev) => (prev ? { ...prev, shortSpecs: { ...prev.shortSpecs, [key]: value } } : prev));
  };

  const updateSpecs = (updater: (specs: SpecCategory[]) => SpecCategory[]) => {
    setDraft((prev) => (prev ? { ...prev, specifications: updater(prev.specifications) } : prev));
  };

  const toggleGalleryPick = (img: string) => {
    setGalleryPicks((prev) => (prev.includes(img) ? prev.filter((u) => u !== img) : [...prev, img]));
  };

  const numOrNull = (value: string) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const busy = saveStage !== 'idle';

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

              {/* Images */}
              <div className="space-y-2">
                <Label>Images</Label>
                <p className="text-sm text-muted-foreground">
                  Click a photo to make it the main image (★). Tick the ones to keep in the gallery.
                  Selected images are automatically copied to our own storage when you save.
                </p>
                {draft.carouselImages.length > 0 && (
                  <div className="flex gap-3 flex-wrap pt-1">
                    {draft.carouselImages.map((img) => {
                      const isMain = draft.imageUrl === img;
                      const inGallery = galleryPicks.includes(img);
                      return (
                        <div key={img} className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              updateDraft({ imageUrl: img });
                              if (!inGallery) toggleGalleryPick(img);
                            }}
                            className={`border-2 rounded p-1 ${isMain ? 'border-blue-500' : inGallery ? 'border-green-500' : 'border-transparent'}`}
                            title="Set as main image"
                          >
                            <img src={img} alt="" className="h-24 w-20 object-contain" loading="lazy" />
                          </button>
                          {isMain && (
                            <Star className="absolute top-1 right-1 h-4 w-4 text-blue-500 fill-blue-500" />
                          )}
                          <label className="absolute bottom-1 left-1 bg-white/80 rounded px-1 text-xs flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inGallery}
                              onChange={() => toggleGalleryPick(img)}
                            />
                            gallery
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-1 pt-2">
                  <Label className="text-xs text-muted-foreground">Main image URL (or paste your own)</Label>
                  <Input value={draft.imageUrl} onChange={(e) => updateDraft({ imageUrl: e.target.value })} />
                </div>
              </div>

              {/* Specifications table editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Specifications</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSpecs((specs) => [...specs, { category: 'New Category', specs: [{ feature: '', value: '' }] }])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Category
                  </Button>
                </div>
                {draft.specifications.map((cat, catIndex) => (
                  <div key={catIndex} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        className="font-medium max-w-xs"
                        value={cat.category}
                        onChange={(e) =>
                          updateSpecs((specs) =>
                            specs.map((c, i) => (i === catIndex ? { ...c, category: e.target.value } : c))
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateSpecs((specs) => specs.filter((_, i) => i !== catIndex))}
                        title="Remove category"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {cat.specs.map((spec, specIndex) => (
                      <div key={specIndex} className="flex gap-2 items-center">
                        <Input
                          placeholder="Feature (e.g. Chipset)"
                          className="max-w-[200px]"
                          value={spec.feature}
                          onChange={(e) =>
                            updateSpecs((specs) =>
                              specs.map((c, i) =>
                                i === catIndex
                                  ? {
                                      ...c,
                                      specs: c.specs.map((s, j) =>
                                        j === specIndex ? { ...s, feature: e.target.value } : s
                                      ),
                                    }
                                  : c
                              )
                            )
                          }
                        />
                        <Input
                          placeholder="Value (e.g. Snapdragon 8 Gen 3)"
                          value={spec.value}
                          onChange={(e) =>
                            updateSpecs((specs) =>
                              specs.map((c, i) =>
                                i === catIndex
                                  ? {
                                      ...c,
                                      specs: c.specs.map((s, j) =>
                                        j === specIndex ? { ...s, value: e.target.value } : s
                                      ),
                                    }
                                  : c
                              )
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateSpecs((specs) =>
                              specs.map((c, i) =>
                                i === catIndex ? { ...c, specs: c.specs.filter((_, j) => j !== specIndex) } : c
                              )
                            )
                          }
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSpecs((specs) =>
                          specs.map((c, i) =>
                            i === catIndex ? { ...c, specs: [...c.specs, { feature: '', value: '' }] } : c
                          )
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Row
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                Source: <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="underline">{draft.sourceUrl}</a>
              </div>

              {saveError && (
                <Alert className="border-red-500">
                  <AlertDescription className="text-red-600">{saveError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 items-center">
                <Button onClick={handleSave} disabled={busy || !draft.name || !draft.brand || !draft.imageUrl}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saveStage === 'copying-images'
                    ? 'Copying images to our server...'
                    : saveStage === 'saving'
                      ? 'Saving...'
                      : draft.existingId
                        ? 'Update Existing Mobile'
                        : 'Save to Database'}
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)} disabled={busy}>
                  Discard
                </Button>
              </div>
              {!draft.imageUrl && (
                <p className="text-sm text-yellow-600">
                  A main image is required before saving — click one above or paste a URL.
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
