import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpecCategory {
  category: string;
  specs: { feature: string; value: string; }[];
}

interface SpecsTableProps {
  specifications: SpecCategory[];
}

export function SpecsTable({ specifications }: SpecsTableProps) {
  return (
    <div className="grid gap-6" data-testid="specs-table">
      {specifications.map((category, categoryIndex) => (
        <Card key={categoryIndex}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {category.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.specs.map((spec, specIndex) => (
                <div
                  key={specIndex}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  data-testid={`spec-${category.category.toLowerCase()}-${spec.feature.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="text-gray-600 font-medium">
                    {spec.feature}
                  </span>
                  <span 
                    className="text-gray-900 font-semibold text-right max-w-xs"
                    dangerouslySetInnerHTML={{ __html: spec.value }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
