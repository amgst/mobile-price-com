import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, Shield, Users, Gavel, Mail } from "lucide-react";

function TermsPage() {
  const termsSections = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Acceptance of Terms",
      content: [
        "By accessing and using MobilePrices.pk, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, please do not use our website",
        "We reserve the right to modify these terms at any time with notice to users",
        "Continued use of the website after changes constitutes acceptance of new terms",
        "These terms apply to all visitors, users, and others who access the service"
      ]
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Description of Service",
      content: [
        "MobilePrices.pk provides mobile phone price comparison and specification information",
        "We aggregate pricing data from various retailers and manufacturers in Pakistan",
        "Our service includes detailed phone specifications, reviews, and buying guides",
        "All content is provided for informational purposes only",
        "We do not sell mobile phones or process any transactions directly"
      ]
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Information Accuracy",
      content: [
        "We strive to provide accurate and up-to-date pricing and specification information",
        "Prices and availability are subject to change without notice by retailers",
        "We do not guarantee the accuracy of all information displayed on our website",
        "Users should verify pricing and specifications with retailers before making purchases",
        "We are not responsible for discrepancies between our data and actual retail prices"
      ]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "User Responsibilities",
      content: [
        "Use the website only for lawful purposes and in accordance with these terms",
        "Do not attempt to interfere with the website's functionality or security",
        "Respect intellectual property rights of all content on the website",
        "Provide accurate information when contacting us or submitting forms",
        "Do not use automated tools to scrape or harvest data from our website"
      ]
    },
    {
      icon: <Gavel className="h-6 w-6" />,
      title: "Limitation of Liability",
      content: [
        "MobilePrices.pk is provided 'as is' without warranties of any kind",
        "We are not liable for any direct, indirect, or consequential damages",
        "We do not guarantee uninterrupted or error-free operation of the website",
        "Users assume all risks associated with use of the information provided",
        "Our total liability shall not exceed the amount you paid to access our service (which is zero)"
      ]
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Contact & Disputes",
      content: [
        "For questions about these terms, contact us at legal@mobileprices.pk",
        "Any disputes will be resolved through arbitration in Lahore, Pakistan",
        "These terms are governed by the laws of Pakistan",
        "If any provision is found invalid, the remaining terms continue to apply",
        "We reserve the right to terminate access for violation of these terms"
      ]
    }
  ];

  const prohibitedUses = [
    "Attempting to gain unauthorized access to our systems or user accounts",
    "Using automated scripts, bots, or crawlers to extract data",
    "Interfering with or disrupting the website or servers",
    "Transmitting viruses, malware, or other harmful code",
    "Impersonating another person or entity",
    "Collecting user information without consent",
    "Using the service for commercial purposes without permission",
    "Posting or transmitting spam, advertisements, or promotional content"
  ];

  const intellectualProperty = [
    "All content on MobilePrices.pk is owned by us or our content suppliers",
    "You may not reproduce, distribute, or create derivative works without permission",
    "Trademarks and logos of mobile phone brands belong to their respective owners",
    "Product images and specifications are used under fair use for comparison purposes",
    "User-generated content (reviews, comments) remains owned by the user but licensed to us"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Terms of Service | MobilePrices.pk</title>
        <meta name="description" content="Terms of Service for MobilePrices.pk. Learn about your rights and responsibilities when using our mobile phone comparison service." />
        <meta name="keywords" content="terms of service, terms and conditions, user agreement, mobile prices terms" />
      </Helmet>

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these Terms of Service carefully before using MobilePrices.pk. 
            These terms govern your use of our website and services.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <strong>Effective Date:</strong> January 1, 2025
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Terms Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Information Service</h3>
                <p className="text-sm text-gray-600">We provide mobile phone information for comparison purposes only</p>
              </div>
              <div>
                <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">No Warranties</h3>
                <p className="text-sm text-gray-600">Information is provided "as is" - verify with retailers before purchasing</p>
              </div>
              <div>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Fair Use</h3>
                <p className="text-sm text-gray-600">Use our service responsibly and respect our terms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {termsSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    {section.icon}
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prohibited Uses */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              Prohibited Uses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              The following activities are strictly prohibited when using MobilePrices.pk:
            </p>
            <ul className="space-y-2">
              {prohibitedUses.map((use, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{use}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Intellectual Property Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {intellectualProperty.map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              Important Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Price Information</h4>
                <p className="text-gray-700">
                  Prices displayed on MobilePrices.pk are collected from various sources and may not reflect 
                  current retail prices. Always verify pricing directly with retailers before making a purchase.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Product Availability</h4>
                <p className="text-gray-700">
                  Product availability information may not be real-time. Contact retailers directly to 
                  confirm stock availability before visiting stores or placing orders.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Third-Party Links</h4>
                <p className="text-gray-700">
                  Our website may contain links to third-party websites. We are not responsible for the 
                  content, privacy policies, or practices of these external sites.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Termination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">We May Terminate Access If:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• You violate these Terms of Service</li>
                  <li>• You engage in prohibited activities</li>
                  <li>• You attempt to harm our website or users</li>
                  <li>• Required by law or legal process</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">You May Stop Using Our Service:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• At any time without notice</li>
                  <li>• If you disagree with our terms</li>
                  <li>• If you no longer need our service</li>
                  <li>• For any other reason</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Questions About These Terms?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Email:</strong> legal@mobileprices.pk
              </div>
              <div>
                <strong>Phone:</strong> +92-321-1234567
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> These terms are effective as of the date listed above. 
                We recommend reviewing them periodically as they may be updated to reflect 
                changes in our service or legal requirements.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

export default TermsPage;