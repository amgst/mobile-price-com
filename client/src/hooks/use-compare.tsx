import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import type { Mobile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CompareContextType {
  compareList: string[];
  addToCompare: (mobile: Mobile) => void;
  removeFromCompare: (mobileId: string) => void;
  clearCompare: () => void;
  isInCompare: (mobileId: string) => boolean;
  compareCount: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<string[]>([]);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("compare-list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompareList(parsed);
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage whenever list changes
  useEffect(() => {
    localStorage.setItem("compare-list", JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (mobile: Mobile) => {
    if (compareList.includes(mobile.id)) {
      toast({
        title: "Already in comparison",
        description: `${mobile.name} is already in your comparison list.`,
      });
      return;
    }

    if (compareList.length >= 4) {
      toast({
        title: "Comparison limit reached",
        description: "You can compare up to 4 phones at once. Remove one to add another.",
        variant: "destructive",
      });
      return;
    }

    const newList = [...compareList, mobile.id];
    setCompareList(newList);
    
    toast({
      title: "Added to comparison",
      description: `${mobile.name} has been added to your comparison list.`,
    });

    // If user has 2+ phones, suggest going to compare page
    if (newList.length >= 2) {
      setTimeout(() => {
        toast({
          title: "Ready to compare",
          description: "You can now view the comparison page to see differences.",
          action: (
            <button 
              onClick={() => setLocation(`/compare?phones=${newList.join(',')}`)}
              className="text-sm underline"
            >
              View Comparison
            </button>
          ),
        });
      }, 1500);
    }
  };

  const removeFromCompare = (mobileId: string) => {
    const newList = compareList.filter(id => id !== mobileId);
    setCompareList(newList);
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem("compare-list");
  };

  const isInCompare = (mobileId: string) => {
    return compareList.includes(mobileId);
  };

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      compareCount: compareList.length,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}