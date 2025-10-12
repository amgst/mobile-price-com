import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, MessageCircle, HelpCircle } from "lucide-react";

function ContactPage() {


  const faqCategories = [
    {
      title: "Price & Availability",
      questions: [
        "How often are prices updated?",
        "Are prices shown with or without taxes?",
        "How to check phone availability?",
        "Do you show international prices?"
      ]
    },
    {
      title: "Technical Support",
      questions: [
        "How to compare multiple phones?",
        "Website loading issues",
        "Mobile app availability",
        "Browser compatibility"
      ]
    },
    {
      title: "Reviews & Content",
      questions: [
        "How to request phone reviews?",
        "Accuracy of specifications",
        "Update frequency for new phones",
        "User review guidelines"
      ]
    }
  ];

  const supportHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Contact Us | MobilePrices.pk</title>
        <meta name="description" content="Get in touch with MobilePrices.pk team. Contact us for support, feedback, or any questions about mobile phones and pricing information." />
        <meta name="keywords" content="contact us, mobile prices support, phone help, customer service" />
      </Helmet>

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about mobile phones, pricing, or our services? 
            We're here to help! Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="+92-3xx-xxxxxxx"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <select 
                      id="subject"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Select a topic</option>
                      <option value="pricing">Price Inquiry</option>
                      <option value="review">Request Phone Review</option>
                      <option value="technical">Technical Support</option>
                      <option value="feedback">Website Feedback</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please describe your question or feedback in detail..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            
            

            {/* Support Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportHours.map((schedule) => (
                    <div key={schedule.day} className="flex justify-between">
                      <span className="text-gray-600">{schedule.day}</span>
                      <span className="font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Email responses are typically sent within 24 hours, 
                    even outside business hours.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqCategories.map((category) => (
                    <div key={category.title}>
                      <h4 className="font-semibold text-gray-900 mb-2">{category.title}</h4>
                      <ul className="space-y-1">
                        {category.questions.map((question, index) => (
                          <li key={index}>
                            <a 
                              href="#" 
                              className="text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                              • {question}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-sm text-gray-600">
                Most inquiries are answered within a few hours during business days.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-sm text-gray-600">
                Our team consists of mobile technology experts ready to help.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multiple Channels</h3>
              <p className="text-sm text-gray-600">
                Choose your preferred way to reach us - email, phone, or WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;