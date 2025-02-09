
import CreateEventDialog from "./CreateEventDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Event Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor and analyze market-moving events in real-time
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={() => onOpenChange(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Event
        </Button>
        <CreateEventDialog
          isOpen={isCreating}
          onOpenChange={onOpenChange}
        />
        <Tabs 
          defaultValue={view} 
          onValueChange={(v) => onViewChange(v as "grid" | "watchlist")}
          className="bg-card/40 backdrop-blur-sm rounded-lg border border-accent/10"
        >
          <TabsList>
            <TabsTrigger value="grid" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Grid View
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Watchlist
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardHeader;
