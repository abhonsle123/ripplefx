
import React from 'react';
import { format } from "date-fns";
import { Calendar, Building2, ArrowRight } from 'lucide-react';

interface CardFooterProps {
  createdAt: string;
  affectedOrganizations: string[] | Record<string, string> | null;
  eventType: string;
}

const CardFooter = ({ 
  createdAt, 
  affectedOrganizations, 
  eventType 
}: CardFooterProps) => {
  const formattedAffectedOrgs = affectedOrganizations 
    ? (typeof affectedOrganizations === 'object' 
        ? Object.values(affectedOrganizations) 
        : Array.isArray(affectedOrganizations) 
          ? affectedOrganizations 
          : []
      ).join(', ')
    : 'No organizations listed';

  return (
    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        <span>Added on {format(new Date(createdAt), 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4" />
        <span>Affected: {formattedAffectedOrgs}</span>
      </div>
      <div className="flex items-center gap-1">
        <ArrowRight className="h-4 w-4" />
        <span>Event Type: {eventType}</span>
      </div>
    </div>
  );
};

export default CardFooter;
