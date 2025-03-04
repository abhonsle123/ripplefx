
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  disabled?: boolean;
  current?: boolean;
  planId?: string;
  onSubscribe?: () => void;
}

const PricingCard = ({
  title,
  price,
  description,
  features,
  recommended = false,
  disabled = false,
  current = false,
  onSubscribe,
}: PricingCardProps) => {
  return (
    <div
      className={`relative p-8 rounded-xl transition-all duration-300 ${
        recommended
          ? "bg-card border-2 border-primary shadow-lg shadow-primary/20 scale-105"
          : "bg-accent hover:scale-102 shadow-lg hover:shadow-xl"
      } ${disabled ? "opacity-80" : ""} group hover:translate-y-[-4px]`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-sm font-medium shadow-sm">
          Recommended
        </span>
      )}
      {disabled && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary px-4 py-1 rounded-full text-sm font-medium shadow-sm">
          Coming Soon
        </div>
      )}
      {current && !disabled && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 px-4 py-1 rounded-full text-sm font-medium text-white shadow-sm">
          Current Plan
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
            <div className="bg-primary/10 p-1 rounded-full">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        className={`w-full transition-all duration-300 ${
          recommended ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-transparent border border-primary/50 text-primary hover:bg-primary/10"
        }`}
        variant={recommended ? "default" : "outline"}
        disabled={disabled || current}
        onClick={onSubscribe}
      >
        {current ? "Current Plan" : disabled ? "Coming Soon" : "Subscribe"}
      </Button>
    </div>
  );
};

export default PricingCard;
