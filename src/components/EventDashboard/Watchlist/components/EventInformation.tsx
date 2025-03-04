
import React from 'react';
import { PriceImpactAnalysis } from '../types';

interface EventInformationProps {
  title: string;
  description: string;
  priceImpactAnalysis: PriceImpactAnalysis | null;
}

const EventInformation = ({ 
  title, 
  description, 
  priceImpactAnalysis 
}: EventInformationProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm">{description}</p>
      {priceImpactAnalysis && (
        <div className="mt-2 space-y-1">
          <p className="text-sm">{priceImpactAnalysis.summary}</p>
          {priceImpactAnalysis.factors && (
            <ul className="text-sm list-disc list-inside">
              {priceImpactAnalysis.factors.slice(0, 2).map((factor, i) => (
                <li key={i} className="text-muted-foreground">{factor}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default EventInformation;
