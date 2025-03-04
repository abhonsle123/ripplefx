
import CreateEventDialog from "./CreateEventDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Layout, ListFilter } from "lucide-react";
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
    <div className="relative">
      {/* Decorative elements */}
      <div className="absolute -top-4 left-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -z-10"></div>
      <div className="absolute top-10 right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl -z-10"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 bg-card/30 backdrop-blur-sm rounded-xl p-8 border border-accent/10 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary/90 to-foreground/80 bg-clip-text text-transparent">
            Event Dashboard
          </h1>
          <p className="text-muted-foreground max-w-md">
            Monitor and analyze market-moving events in real-time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={() => onOpenChange(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
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
            className="bg-card/40 backdrop-blur-sm rounded-lg border border-accent/10 shadow-sm"
          >
            <TabsList>
              <TabsTrigger value="grid" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1">
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline">Grid View</span>
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1">
                <ListFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Watchlist</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
