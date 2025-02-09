
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "RippleEffect has revolutionized how I invest. The real-time alerts are a game changer!",
    author: "John D.",
    role: "Independent Investor",
    rating: 5,
  },
  {
    quote:
      "I never thought I'd have access to such advanced insights. Highly recommend RippleEffect.",
    author: "Emily T.",
    role: "Portfolio Manager",
    rating: 5,
  },
  {
    quote:
      "The AI-driven analysis gives me confidence in my investment decisions. Outstanding service!",
    author: "Michael R.",
    role: "Day Trader",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container px-4 pt-32">
        <div className="text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            What Our Users Say
          </h1>
          <p className="text-xl text-muted-foreground">
            Join thousands of satisfied investors who trust RippleEffect
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-card/40 backdrop-blur-sm border border-accent/10 hover:scale-[1.02] transition-all duration-300 animate-slideUp flex flex-col justify-between"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-lg mb-6 text-foreground italic">
                  "{testimonial.quote}"
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
