
import { CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').toLowerCase();
  };

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex gap-2">
          <Badge className={`${getSeverityColor(severity)}`}>
            {severity.toLowerCase()}
          </Badge>
          <Badge variant="outline">
            {formatEventType(eventType)}
          </Badge>
          {isRelevant && (
            <Badge variant="default" className="bg-primary">
              Relevant
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
  );
};

export default EventCardHeader;
