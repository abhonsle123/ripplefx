
import React from 'react';
import { format } from "date-fns";
import { Calendar, Building2, ArrowRight } from 'lucide-react';

interface CardFooterProps {
  createdAt: string;
  affectedOrganizations: string[] | Record<string, string> | string | null;
  eventType: string;
}

const CardFooter = ({ 
  createdAt, 
  affectedOrganizations, 
  eventType 
}: CardFooterProps) => {
  const formatAffectedOrgs = () => {
    if (!affectedOrganizations) return 'No organizations listed';
    
    if (typeof affectedOrganizations === 'string') {
      return affectedOrganizations;
    }
    
    if (Array.isArray(affectedOrganizations)) {
      return affectedOrganizations.join(', ');
    }
    
    if (typeof affectedOrganizations === 'object') {
      return Object.values(affectedOrganizations).join(', ');
    }
    
    return 'No organizations listed';
  };

  return (
    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        <span>Added on {format(new Date(createdAt), 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4" />
        <span>Affected: {formatAffectedOrgs()}</span>
      </div>
      <div className="flex items-center gap-1">
        <ArrowRight className="h-4 w-4" />
        <span>Event Type: {eventType}</span>
      </div>
    </div>
  );
};

export default CardFooter;
