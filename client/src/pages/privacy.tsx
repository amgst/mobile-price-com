import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, Mail } from "lucide-react";

function PrivacyPage() {
  const privacySections = [
    {
      icon: <Database className="h-6 w-6" />,
      title: "Information We Collect",
      content: [
        "Personal information you provide when contacting us (name, email, phone number)",
        "Device information (browser type, operating system, IP address)",
        "Usage data (pages visited, time spent, search queries)",
        "Cookie data for improving website functionality",
        "No financial or payment information is collected as we don't process transactions"
      ]
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "How We Use Your Information",
      content: [
        "Provide accurate mobile phone pricing and specification information",
        "Respond to your inquiries and support requests",
        "Improve our website functionality and user experience",
        "Send relevant updates about mobile phones and pricing (only if you opt-in)",
        "Analyze website traffic and user behavior for optimization"
      ]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Information Sharing",
      content: [
        "We do not sell, trade, or rent your personal information to third parties",
        "Information may be shared with service providers who help operate our website",
        "We may disclose information if required by law or to protect our rights",
        "Anonymous, aggregated data may be shared for research or analytical purposes",
        "Your email will never be shared with mobile phone manufacturers or retailers"
      ]
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your data",
        "All data transmission is encrypted using SSL/TLS protocols",
        "Regular security audits and updates to prevent unauthorized access",
        "Limited access to personal information on a need-to-know basis",
        "Secure servers hosted with reputable cloud providers"
      ]
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Your Rights",
      content: [
        "Access: Request a copy of the personal information we hold about you",
        "Correction: Ask us to correct any inaccurate or incomplete information",
        "Deletion: Request deletion of your personal information",
        "Portability: Request your data in a commonly used, machine-readable format",
        "Opt-out: Unsubscribe from marketing communications at any time"
      ]
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Contact & Updates",
      content: [
        "For privacy-related questions, contact us at privacy@mobileprices.pk",
        "We will notify users of significant changes to this privacy policy",
        "Policy updates will be posted on this page with the effective date",
        "Continued use of our website constitutes acceptance of privacy policy changes",
        "You can request clarification on any privacy practices at any time"
      ]
    }
  ];

  const cookieTypes = [
    {
      type: "Essential Cookies",
      description: "Required for basic website functionality",
      examples: ["Session management", "Security features", "Form submissions"]
    },
    {
      type: "Analytics Cookies",
      description: "Help us understand how visitors use our website",
      examples: ["Page views", "Popular content", "User navigation patterns"]
    },
    {
      type: "Preference Cookies",
      description: "Remember your choices and preferences",
      examples: ["Language selection", "Display preferences", "Search filters"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Privacy Policy | MobilePrices.pk</title>
        <meta name="description" content="Learn how MobilePrices.pk collects, uses, and protects your personal information. Our commitment to your privacy and data security." />
        <meta name="keywords" content="privacy policy, data protection, user privacy, mobile prices privacy" />
      </Helmet>

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, 
            and protect your information when you use MobilePrices.pk.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <strong>Last Updated:</strong> January 1, 2025
          </div>
        </div>

        {/* Privacy Commitment */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Privacy Commitment</h2>
            <p className="text-lg text-gray-600 mb-6">
              MobilePrices.pk is committed to protecting your privacy and ensuring transparency 
              in how we handle your personal information. We only collect information necessary 
              to provide you with the best mobile phone comparison service in Pakistan.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Secure</h3>
                <p className="text-sm text-gray-600">Your data is protected with industry-standard security</p>
              </div>
              <div>
                <Eye className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Transparent</h3>
                <p className="text-sm text-gray-600">Clear information about what we collect and why</p>
              </div>
              <div>
                <UserCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Your Control</h3>
                <p className="text-sm text-gray-600">You have full control over your personal information</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {privacySections.map((section) => (
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

        {/* Cookie Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Cookie Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-6">
              We use cookies to enhance your browsing experience and provide personalized content. 
              Here's what types of cookies we use:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cookieTypes.map((cookie) => (
                <div key={cookie.type} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{cookie.type}</h4>
                  <p className="text-sm text-gray-600 mb-3">{cookie.description}</p>
                  <div className="space-y-1">
                    {cookie.examples.map((example, index) => (
                      <div key={index} className="text-xs text-gray-500">• {example}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">How Long We Keep Your Data</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Contact form submissions: 2 years</li>
                  <li>• Website analytics data: 26 months</li>
                  <li>• Email communications: Until you unsubscribe</li>
                  <li>• Technical logs: 90 days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Data Deletion</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• You can request data deletion at any time</li>
                  <li>• Automatic deletion after retention period</li>
                  <li>• Some data may be retained for legal compliance</li>
                  <li>• Anonymized data may be kept for research</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Our service is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If we become aware that we have 
              collected personal information from a child under 13, we will take steps to delete 
              such information from our files.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Questions About This Policy?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, 
              please don't hesitate to contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Email:</strong> privacy@mobileprices.pk
              </div>
              <div>
                <strong>Phone:</strong> +92-321-1234567
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

export default PrivacyPage;