import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { CompareProvider } from "@/hooks/use-compare";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Brands from "@/pages/brands";
import BrandCategory from "@/pages/brand-category";
import MobileDetail from "@/pages/mobile-detail";
import Search from "@/pages/search";
import Compare from "@/pages/compare";
import Admin from "@/pages/admin";
import AdminImport from "@/pages/AdminImport";
import AdminLogin from "@/pages/admin-login";
import Export from "@/pages/export";
import Reviews from "@/pages/reviews";
import Guide from "@/pages/guide";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/brands" component={Brands} />
      <Route path="/search" component={Search} />
      <Route path="/compare" component={Compare} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/guide" component={Guide} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/import" component={AdminImport} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/export" component={Export} />
      <Route path="/:brand" component={BrandCategory} />
      <Route path="/:brand/:model" component={MobileDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <CompareProvider>
            <Toaster />
            <Router />
          </CompareProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
