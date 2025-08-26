import { Link } from "wouter";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex" aria-label="Breadcrumb" data-testid="breadcrumbs">
          <ol className="flex items-center space-x-2">
            <li>
              <Link 
                href="/" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                data-testid="breadcrumb-home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {items.map((item, index) => (
              <li key={item.href} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                {item.isActive ? (
                  <span 
                    className="text-gray-900 font-medium"
                    data-testid={`breadcrumb-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link 
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    data-testid={`breadcrumb-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
