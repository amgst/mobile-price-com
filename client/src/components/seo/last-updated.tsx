import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LastUpdatedProps {
  date?: Date | string;
  className?: string;
}

export function LastUpdated({ date, className = "" }: LastUpdatedProps) {
  // Use provided date or current date as fallback
  const lastUpdatedDate = date ? new Date(date) : new Date();
  
  // Format date as "January 15, 2025"
  const formattedDate = lastUpdatedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <Calendar className="w-4 h-4" />
      <span>Last updated: <strong>{formattedDate}</strong></span>
    </div>
  );
}

