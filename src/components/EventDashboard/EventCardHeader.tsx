
import { CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, AlertOctagon, Info } from "lucide-react";

interface EventCardHeaderProps {
  title: string;
  severity: string;
  eventType: string;
  isRelevant: boolean;
}

const EventCardHeader = ({ title, severity, eventType, isRelevant }: EventCardHeaderProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 border-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertOctagon className="h-3.5 w-3.5" />;
      case 'high':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'medium':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  };

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').toLowerCase();
  };

  return (
    <CardHeader className="flex flex-col space-y-2 pb-2">
      <h3 className="font-semibold text-lg leading-tight">{title}</h3>
      <div className="flex flex-wrap gap-2">
        <Badge className={`${getSeverityColor(severity)} shadow-sm flex items-center gap-1 font-medium`}>
          {getSeverityIcon(severity)}
          {severity.toLowerCase()}
        </Badge>
        <Badge variant="outline" className="border-accent/30 shadow-sm font-medium">
          {formatEventType(eventType)}
        </Badge>
        {isRelevant && (
          <Badge variant="default" className="bg-primary/90 hover:bg-primary shadow-sm">
            Relevant
          </Badge>
        )}
      </div>
    </CardHeader>
  );
};

export default EventCardHeader;
