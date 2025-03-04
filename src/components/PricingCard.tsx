
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  disabled?: boolean;
}

const PricingCard = ({
  title,
  price,
  description,
  features,
  recommended = false,
  disabled = false,
}: PricingCardProps) => {
  return (
    <div
      className={`relative p-8 rounded-xl transition-all duration-300 ${
        recommended
          ? "bg-card border-2 border-primary scale-105"
          : "bg-accent hover:scale-102"
      } ${disabled ? "opacity-80" : ""} animate-slideUp`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-sm font-medium">
          Recommended
        </span>
      )}
      {disabled && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary px-4 py-1 rounded-full text-sm font-medium">
          Coming Soon
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-4xl font-bold mb-2">{price}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        className="w-full" 
        variant={recommended ? "default" : "outline"}
        disabled={disabled}
      >
        {disabled ? "Coming Soon" : "Get Started"}
      </Button>
    </div>
  );
};

export default PricingCard;
