import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";

function ReviewsPage() {
  const featuredReviews = [
    {
      id: 1,
      title: "iPhone 15 Pro Max Review: The Ultimate Smartphone Experience",
      excerpt: "Apple's latest flagship delivers exceptional performance, camera quality, and build premium that justifies its price tag.",
      rating: 4.5,
      author: "Tech Expert Team",
      date: "January 15, 2025",
      likes: 245,
      comments: 32,
      image: "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg"
    },
    {
      id: 2,
      title: "Samsung Galaxy S24 Ultra: Android Excellence Redefined",
      excerpt: "Samsung's S24 Ultra combines powerful performance with the best S Pen experience and versatile camera system.",
      rating: 4.3,
      author: "Mobile Review Team",
      date: "January 10, 2025",
      likes: 189,
      comments: 28,
      image: "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg"
    },
    {
      id: 3,
      title: "Xiaomi 14 Pro: Flagship Performance at Mid-Range Price",
      excerpt: "Xiaomi delivers premium features including Leica cameras and flagship performance at an incredibly competitive price point.",
      rating: 4.2,
      author: "Value Tech Reviews",
      date: "January 5, 2025",
      likes: 156,
      comments: 19,
      image: "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg"
    }
  ];

  const categories = [
    { name: "Latest Reviews", count: 24, href: "/reviews?category=latest" },
    { name: "Flagship Phones", count: 18, href: "/reviews?category=flagship" },
    { name: "Budget Phones", count: 32, href: "/reviews?category=budget" },
    { name: "Mid-Range", count: 28, href: "/reviews?category=midrange" },
    { name: "Camera Reviews", count: 15, href: "/reviews?category=camera" },
    { name: "Gaming Phones", count: 12, href: "/reviews?category=gaming" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Mobile Phone Reviews | MobilePrices.pk</title>
        <meta name="description" content="Read expert mobile phone reviews, ratings, and detailed analysis of latest smartphones. Get authentic insights before buying your next phone." />
        <meta name="keywords" content="mobile reviews, phone reviews, smartphone reviews, mobile ratings, phone comparison" />
      </Helmet>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mobile Phone Reviews</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert reviews and detailed analysis of the latest smartphones. Get authentic insights 
            from our testing team to make informed buying decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Reviews */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Reviews</h2>
              <div className="space-y-6">
                {featuredReviews.map((review) => (
                  <Card key={review.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="md:flex">
                      <div className="md:w-48 md:h-32 bg-gray-200">
                        <img 
                          src={review.image} 
                          alt={review.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{review.author}</Badge>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium">{review.rating}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary cursor-pointer">
                          {review.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{review.excerpt}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{review.date}</span>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              {review.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {review.comments}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Want a Specific Phone Reviewed?</h3>
                <p className="mb-6">
                  Our expert team is always testing the latest smartphones. 
                  Let us know which phone you'd like to see reviewed next!
                </p>
                <a 
                  href="/contact" 
                  className="inline-block bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Request a Review
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Review Categories */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Review Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <a 
                      key={category.name}
                      href={category.href}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular This Week */}
            <Card>
              <CardHeader>
                <CardTitle>Popular This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h4 className="font-medium text-sm">iPhone 15 Pro Max vs Galaxy S24 Ultra</h4>
                      <p className="text-xs text-gray-500">Detailed Comparison</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h4 className="font-medium text-sm">Best Budget Phones Under ₨50,000</h4>
                      <p className="text-xs text-gray-500">Buying Guide</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h4 className="font-medium text-sm">OnePlus 12 Long-term Review</h4>
                      <p className="text-xs text-gray-500">3 Months Later</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ReviewsPage;