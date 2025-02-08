
import { Card } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EventAnalyticsProps {
  events: Event[];
}

const EventAnalytics = ({ events }: EventAnalyticsProps) => {
  const analyticsData = events.reduce((acc, event) => {
    const type = event.event_type;
    const existing = acc.find(item => item.type === type);
    if (existing) {
      existing.count += 1;
      existing[event.severity.toLowerCase()] = (existing[event.severity.toLowerCase()] || 0) + 1;
    } else {
      acc.push({
        type,
        count: 1,
        [event.severity.toLowerCase()]: 1
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Events by Type and Severity</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="critical" stackId="a" fill="#ef4444" />
            <Bar dataKey="high" stackId="a" fill="#f97316" />
            <Bar dataKey="medium" stackId="a" fill="#eab308" />
            <Bar dataKey="low" stackId="a" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default EventAnalytics;
