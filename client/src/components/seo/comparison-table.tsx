import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { SafeImage } from "@/components/ui/safe-image";
import { ImageUtils } from "@/lib/image-utils";
import type { Mobile } from "@shared/schema";

interface ComparisonTableProps {
  mobile: Mobile;
  relatedMobiles?: Mobile[];
  title?: string;
}

export function ComparisonTable({ mobile, relatedMobiles, title = "Compare Similar Mobiles" }: ComparisonTableProps) {
  if (!relatedMobiles || relatedMobiles.length === 0) return null;

  // Select up to 4 related mobiles for comparison
  const comparisonMobiles = relatedMobiles
    .filter(m => m.id !== mobile.id)
    .slice(0, 4);

  if (comparisonMobiles.length === 0) return null;

  const allMobiles = [mobile, ...comparisonMobiles];

  // Extract numeric price for sorting
  const getNumericPrice = (price: string | undefined) => {
    if (!price) return 0;
    return parseInt(price.replace(/[₨,\s]/g, '')) || 0;
  };

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left font-semibold text-gray-900">Model</th>
                  {allMobiles.map((m) => (
                    <th key={m.id} className="p-4 text-center min-w-[180px]">
                      <Link href={`/${m.brand.toLowerCase()}/${m.slug}`} className="block">
                        <div className="flex flex-col items-center cursor-pointer hover:text-primary transition-colors">
                          <SafeImage
                            src={ImageUtils.createImageSources(m.imageUrl, m.carouselImages || [], m.brand)}
                            alt={m.name}
                            className="w-20 h-20 object-contain mb-2"
                            quality="medium"
                          />
                          <span className="font-semibold text-sm text-center line-clamp-2">{m.name}</span>
                        </div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Price in Pakistan</td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center">
                      <span className="font-bold text-green-600">{m.price}</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">RAM</td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center text-gray-700">{m.shortSpecs.ram}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Storage</td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center text-gray-700">{m.shortSpecs.storage}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Camera</td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center text-gray-700 text-sm">{m.shortSpecs.camera}</td>
                  ))}
                </tr>
                {allMobiles.some(m => m.shortSpecs.battery) && (
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Battery</td>
                    {allMobiles.map((m) => (
                      <td key={m.id} className="p-4 text-center text-gray-700">{m.shortSpecs.battery || "N/A"}</td>
                    ))}
                  </tr>
                )}
                {allMobiles.some(m => m.shortSpecs.display) && (
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Display</td>
                    {allMobiles.map((m) => (
                      <td key={m.id} className="p-4 text-center text-gray-700 text-sm">{m.shortSpecs.display || "N/A"}</td>
                    ))}
                  </tr>
                )}
                {allMobiles.some(m => m.shortSpecs.processor) && (
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">Processor</td>
                    {allMobiles.map((m) => (
                      <td key={m.id} className="p-4 text-center text-gray-700 text-sm">{m.shortSpecs.processor || "N/A"}</td>
                    ))}
                  </tr>
                )}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Release Date</td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center text-gray-700">{m.releaseDate}</td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4"></td>
                  {allMobiles.map((m) => (
                    <td key={m.id} className="p-4 text-center">
                      <Link href={`/${m.brand.toLowerCase()}/${m.slug}`} className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium">
                        View Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

