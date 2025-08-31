import { useQuery } from "@tanstack/react-query";

interface SiteStats {
  totalMobiles: number;
  totalBrands: number;
  dailyUpdates: string;
  userReviews: string;
}

export function useStats() {
  const { data: mobiles } = useQuery({
    queryKey: ["/api/mobiles"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stats: SiteStats = {
    totalMobiles: mobiles?.length || 0,
    totalBrands: brands?.filter(b => b.isVisible !== false)?.length || 0,
    dailyUpdates: "Daily",
    userReviews: "10K+", // Keep static for now
  };

  return stats;
}