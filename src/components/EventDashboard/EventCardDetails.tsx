
import { MapPin, Calendar, AlertCircle } from "lucide-react";

interface EventCardDetailsProps {
  description: string;
  city?: string | null;
  country?: string | null;
  createdAt: string | null;
  affectedOrganizations?: any;
}

const EventCardDetails = ({ 
  description, 
  city, 
  country, 
  createdAt, 
  affectedOrganizations 
}: EventCardDetailsProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      {(city || country) && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>
            {[city, country].filter(Boolean).join(', ')}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(createdAt)}</span>
      </div>

      {affectedOrganizations && (
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Affected Organizations: {
            Array.isArray(affectedOrganizations) 
              ? affectedOrganizations.join(', ')
              : typeof affectedOrganizations === 'object'
                ? Object.values(affectedOrganizations).join(', ')
                : affectedOrganizations
          }</span>
        </div>
      )}
    </div>
  );
};

export default EventCardDetails;
