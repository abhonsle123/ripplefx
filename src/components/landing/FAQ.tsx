
import { useState } from "react";
import { ArrowRight, PlusCircle, MinusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate();
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "How does RippleEffect predict market changes?",
      answer: "RippleEffect uses advanced AI algorithms to analyze market events, news, and historical data patterns. Our system identifies correlations between events and stock movements, providing predictive insights based on this analysis."
    },
    {
      question: "Can I connect RippleEffect to my trading account?",
      answer: "Yes, RippleEffect integrates with major brokerages through secure API connections. This allows you to receive alerts and execute trades directly from our platform. Check our broker connection page for a list of supported platforms."
    },
    {
      question: "What kinds of events does RippleEffect track?",
      answer: "We track a wide range of market-moving events including earnings reports, economic indicators, regulatory changes, major geopolitical developments, industry shifts, and company-specific news that could impact stock performance."
    },
    {
      question: "How accurate are the AI predictions?",
      answer: "Our AI models are continuously learning and improving, with current accuracy rates averaging 70-85% for major market events. We provide confidence scores with each prediction to help you gauge reliability, and we're transparent about historical performance."
    },
    {
      question: "Can I customize what alerts I receive?",
      answer: "Absolutely. Premium and Pro users can set custom alert rules based on event types, confidence thresholds, specific stocks, and potential impact levels. You can also choose how you receive notifications (email, SMS, or in-app)."
    }
  ];

  return (
    <div className="bg-card py-20">
      <div className="container px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border border-white/10 bg-secondary/30 backdrop-blur overflow-hidden">
              <div 
                className="flex items-center justify-between p-6 cursor-pointer group"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0 ml-2">
                  {openFaqs.includes(index) ? (
                    <MinusCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
              <CardContent className={`px-6 pb-6 pt-0 ${openFaqs.includes(index) ? 'block' : 'hidden'}`}>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button
            variant="outline" 
            className="bg-secondary/50 backdrop-blur border-white/10 hover:bg-secondary/70"
            onClick={() => navigate("/features")}
          >
            Learn more about our features
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
