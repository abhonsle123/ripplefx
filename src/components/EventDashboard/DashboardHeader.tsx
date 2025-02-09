
import CreateEventDialog from "./CreateEventDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardHeaderProps {
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  view: "grid" | "watchlist";
  onViewChange: (view: "grid" | "watchlist") => void;
}

const DashboardHeader = ({ 
  isCreating, 
  onOpenChange, 
  view, 
  onViewChange 
}: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <h1 className="text-3xl font-bold">Event Dashboard</h1>
      <div className="flex items-center gap-4">
        <CreateEventDialog
          isOpen={isCreating}
          onOpenChange={onOpenChange}
        />
        <Tabs defaultValue={view} onValueChange={(v) => onViewChange(v as "grid" | "watchlist")}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardHeader;
