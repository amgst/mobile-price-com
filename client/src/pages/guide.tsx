import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Smartphone, Camera, Battery, Cpu, Shield, Zap } from "lucide-react";

function GuidePage() {
  const buyingSteps = [
    {
      step: 1,
      title: "Determine Your Budget",
      description: "Set a realistic budget range. Pakistani market offers great options from ₨15,000 to ₨300,000+",
      tips: ["Consider total cost including accessories", "Factor in potential price drops", "Compare with international prices"]
    },
    {
      step: 2,
      title: "Identify Your Needs",
      description: "Think about how you'll primarily use your phone - calls, social media, gaming, photography, or work",
      tips: ["List must-have features", "Consider your current phone limitations", "Think about future needs"]
    },
    {
      step: 3,
      title: "Research and Compare",
      description: "Compare specifications, read reviews, and check real-world performance across multiple sources",
      tips: ["Use comparison tools", "Read user reviews", "Check video reviews for real-world usage"]
    },
    {
      step: 4,
      title: "Check Availability",
      description: "Verify local availability, warranty coverage, and after-sales service in Pakistan",
      tips: ["Confirm official warranty", "Check service center locations", "Compare prices across retailers"]
    }
  ];

  const keyFeatures = [
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "Processor & Performance",
      description: "Choose based on your usage - flagship for gaming, mid-range for daily tasks",
      considerations: ["Snapdragon vs MediaTek vs Apple Silicon", "RAM requirements (4GB-16GB)", "Storage type (UFS vs eMMC)"]
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Camera System",
      description: "Don't just look at megapixels - sensor size, OIS, and software matter more",
      considerations: ["Main camera sensor size", "Optical Image Stabilization", "Night mode capabilities", "Video recording quality"]
    },
    {
      icon: <Battery className="h-6 w-6" />,
      title: "Battery & Charging",
      description: "Balance battery capacity with charging speed for your daily routine",
      considerations: ["Battery capacity (4000mAh+)", "Fast charging support", "Wireless charging availability", "Battery optimization"]
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Display Quality",
      description: "Screen size, resolution, and refresh rate affect daily experience",
      considerations: ["AMOLED vs LCD technology", "Refresh rate (60Hz-120Hz)", "Brightness levels", "Screen-to-body ratio"]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Build & Durability",
      description: "Consider build materials and protection ratings for longevity",
      considerations: ["Gorilla Glass protection", "IP rating for water resistance", "Build materials", "Drop test ratings"]
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Software & Updates",
      description: "Long-term software support ensures security and new features",
      considerations: ["Android version", "Update frequency", "UI customization", "Bloatware levels"]
    }
  ];

  const priceRanges = [
    {
      range: "Under ₨25,000",
      description: "Entry-level smartphones with basic features",
      features: ["Basic cameras", "4GB RAM", "64-128GB storage", "HD+ displays"],
      recommended: ["Xiaomi Redmi series", "Samsung Galaxy A series", "Realme C series"]
    },
    {
      range: "₨25,000 - ₨50,000",
      description: "Mid-range phones with balanced performance",
      features: ["Good cameras", "6-8GB RAM", "128-256GB storage", "FHD+ displays"],
      recommended: ["Xiaomi Mi series", "Samsung Galaxy A5x", "OnePlus Nord series"]
    },
    {
      range: "₨50,000 - ₨100,000",
      description: "Premium mid-range with flagship features",
      features: ["Excellent cameras", "8-12GB RAM", "256GB+ storage", "High refresh rate"],
      recommended: ["OnePlus series", "Samsung Galaxy S series", "Xiaomi Pro series"]
    },
    {
      range: "Above ₨100,000",
      description: "Flagship phones with cutting-edge technology",
      features: ["Pro cameras", "12-16GB RAM", "512GB+ storage", "Premium build"],
      recommended: ["iPhone Pro series", "Samsung Galaxy S Ultra", "OnePlus Pro series"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Mobile Phone Buying Guide | MobilePrices.pk</title>
        <meta name="description" content="Complete guide to buying smartphones in Pakistan. Learn about specifications, price ranges, and make informed decisions with expert advice." />
        <meta name="keywords" content="mobile buying guide, smartphone guide, phone buying tips, mobile specifications guide" />
      </Helmet>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mobile Phone Buying Guide</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to choosing the perfect smartphone for your needs and budget. 
            Make informed decisions with expert advice tailored for Pakistani market.
          </p>
        </div>

        {/* Buying Process Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Phone Buying Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {buyingSteps.map((step) => (
              <Card key={step.step} className="relative">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Features to Consider */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Key Features to Consider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyFeatures.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.considerations.map((consideration, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{consideration}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Price Range Guide */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Price Range Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priceRanges.map((range) => (
              <Card key={range.range} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl text-primary">{range.range}</CardTitle>
                    <Badge variant="outline">Pakistani Market</Badge>
                  </div>
                  <p className="text-gray-600">{range.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">What to Expect:</h4>
                    <div className="flex flex-wrap gap-2">
                      {range.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Brands:</h4>
                    <ul className="space-y-1">
                      {range.recommended.map((brand, index) => (
                        <li key={index} className="text-sm text-gray-600">• {brand}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Phone?</h2>
          <p className="text-xl mb-8 opacity-90">
            Use our comparison tools to find the best smartphone that matches your needs and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="/compare">Compare Phones</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <a href="/search">Browse All Phones</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default GuidePage;