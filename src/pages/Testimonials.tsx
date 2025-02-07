
const testimonials = [
  {
    quote:
      "RippleEffect has revolutionized how I invest. The real-time alerts are a game changer!",
    author: "John D.",
    role: "Independent Investor",
  },
  {
    quote:
      "I never thought I'd have access to such advanced insights. Highly recommend RippleEffect.",
    author: "Emily T.",
    role: "Portfolio Manager",
  },
  {
    quote:
      "The AI-driven analysis gives me confidence in my investment decisions. Outstanding service!",
    author: "Michael R.",
    role: "Day Trader",
  },
];

const Testimonials = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-32">
      <div className="container px-4">
        <h1 className="text-4xl font-bold text-center mb-16 animate-fadeIn">
          What Our Users Say
        </h1>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-accent animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-lg mb-6 text-muted-foreground">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
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
