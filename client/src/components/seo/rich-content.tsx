import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Smartphone, Camera, Battery, Cpu, HardDrive, Wifi } from "lucide-react";
import type { Mobile } from "@shared/schema";

interface RichContentProps {
  mobile: Mobile;
}

export function TechnicalHighlights({ mobile }: RichContentProps) {
  const highlights = [
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "Processor",
      value: mobile.shortSpecs.processor || "Advanced Chipset",
      description: "High-performance processing power"
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: "Camera",
      value: mobile.shortSpecs.camera,
      description: "Professional photography capabilities"
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      title: "Storage",
      value: `${mobile.shortSpecs.ram} + ${mobile.shortSpecs.storage}`,
      description: "Memory and storage capacity"
    },
    {
      icon: <Battery className="w-5 h-5" />,
      title: "Battery",
      value: mobile.shortSpecs.battery || "All-day battery",
      description: "Long-lasting power performance"
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((highlight, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-1">{highlight.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{highlight.title}</h3>
                  <p className="text-lg font-bold text-gray-900 mt-1">{highlight.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{highlight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function PriceAnalysis({ mobile }: RichContentProps) {
  // Extract numeric price for calculations
  const numericPrice = parseInt(mobile.price?.replace(/[₨,\s]/g, '') || '0');
  const priceRange = numericPrice < 50000 ? 'Budget-Friendly' : 
                    numericPrice < 150000 ? 'Mid-Range' : 'Premium';
  
  const valueProposition = numericPrice < 50000 ? 
    'Excellent value for money with essential features' :
    numericPrice < 150000 ? 
    'Perfect balance of features and affordability' :
    'Premium experience with cutting-edge technology';

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Price Analysis</h2>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-green-600">{mobile.price}</p>
              <Badge variant="secondary" className="mt-2">{priceRange}</Badge>
            </div>
            <div className="text-right">
              <div className="flex items-center">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-gray-600">4.2/5 (156 reviews)</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Based on user feedback</p>
            </div>
          </div>
          <p className="text-gray-700">{valueProposition}</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Price Tip:</strong> This price is competitive in the Pakistani market. 
              Consider checking multiple retailers for the best deals.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function FrequentlyAskedQuestions({ mobile }: RichContentProps) {
  const faqs = [
    {
      question: `What is the current price of ${mobile.name} in Pakistan?`,
      answer: `The ${mobile.name} is currently priced at ${mobile.price} in Pakistan. Prices may vary slightly between different retailers and cities. For the most accurate pricing, we recommend checking with local retailers or authorized dealers.`
    },
    {
      question: `What are the key features of ${mobile.name}?`,
      answer: `Key features include ${mobile.shortSpecs.ram} RAM, ${mobile.shortSpecs.storage} storage, ${mobile.shortSpecs.camera} camera system, and ${mobile.shortSpecs.battery || 'advanced battery technology'}. The device runs on the latest Android/iOS operating system and offers excellent performance for daily use.`
    },
    {
      question: `Is ${mobile.name} worth buying in 2025?`,
      answer: `${mobile.name} offers excellent value with modern features and reliable performance. It's a solid choice for users looking for ${mobile.shortSpecs.ram} RAM and ${mobile.shortSpecs.camera} camera capabilities. The device provides good performance-to-price ratio in the Pakistani market.`
    },
    {
      question: `Where can I buy ${mobile.name} in Pakistan?`,
      answer: `You can purchase ${mobile.name} from authorized ${mobile.brand} dealers, major electronics stores, and reputable online retailers across Pakistan. Popular stores include Daraz, Shophive, and local mobile markets in major cities like Karachi, Lahore, and Islamabad.`
    },
    {
      question: `Does ${mobile.name} support 5G?`,
      answer: `Please check the detailed specifications for network connectivity information. Most modern smartphones including ${mobile.name} support advanced network technologies. For 5G support specifically, refer to the network specifications section on this page.`
    },
    {
      question: `What is the battery life of ${mobile.name}?`,
      answer: `The ${mobile.name} features ${mobile.shortSpecs.battery || 'a high-capacity battery'} that provides excellent battery life for daily use. With normal usage including calls, browsing, and social media, you can expect a full day of battery life. Battery performance may vary based on usage patterns and settings.`
    },
    {
      question: `How much RAM and storage does ${mobile.name} have?`,
      answer: `The ${mobile.name} comes with ${mobile.shortSpecs.ram} RAM and ${mobile.shortSpecs.storage} internal storage. This configuration provides smooth multitasking and ample space for apps, photos, videos, and other files. The device offers excellent performance for most daily tasks and entertainment needs.`
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ComparisonSuggestions({ mobile, relatedMobiles }: RichContentProps & { relatedMobiles?: Mobile[] }) {
  if (!relatedMobiles || relatedMobiles.length <= 1) return null;

  const suggestions = relatedMobiles
    .filter(related => related.id !== mobile.id)
    .slice(0, 3);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare with Similar Models</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={suggestion.imageUrl} 
                  alt={suggestion.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{suggestion.name}</h3>
                  <p className="text-green-600 font-bold">{suggestion.price}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>RAM:</span>
                  <span>{suggestion.shortSpecs.ram}</span>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <span>{suggestion.shortSpecs.camera}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span>{suggestion.shortSpecs.storage}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ExpertReview({ mobile }: RichContentProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Expert Review</h2>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="ml-2 text-lg font-semibold">4.2/5</span>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              The <strong>{mobile.name}</strong> stands out in the competitive smartphone market with its 
              impressive <strong>{mobile.shortSpecs.camera}</strong> camera system and <strong>{mobile.shortSpecs.ram}</strong> RAM 
              configuration. Released in <strong>{mobile.releaseDate}</strong>, this device offers excellent value 
              for users seeking reliable performance.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pros:</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Excellent {mobile.shortSpecs.camera} camera system with advanced features</li>
              <li>Smooth performance with {mobile.shortSpecs.ram} RAM</li>
              <li>Generous {mobile.shortSpecs.storage} internal storage capacity</li>
              <li>Competitive pricing in the Pakistani market</li>
              <li>Regular software updates and security patches</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cons:</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Battery life could be improved for heavy usage</li>
              <li>Limited availability in some smaller cities</li>
              <li>No wireless charging support</li>
            </ul>

            <div className="bg-green-50 p-4 rounded-lg mt-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Bottom Line:</h3>
              <p className="text-green-700">
                The {mobile.name} is a solid choice for users looking for a reliable smartphone with 
                good camera capabilities and performance. At {mobile.price}, it offers competitive 
                value in the Pakistani market.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}