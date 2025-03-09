
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

type EventType = Database["public"]["Enums"]["event_type"];
type SeverityLevel = Database["public"]["Enums"]["severity_level"];

interface CreateEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEventDialog = ({ isOpen, onOpenChange }: CreateEventDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "NATURAL_DISASTER" as EventType,
    severity: "LOW" as SeverityLevel,
    city: "",
    country: "",
  });

  const handleCreateEvent = async () => {
    try {
      setIsProcessing(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to create events",
          variant: "destructive",
        });
        return;
      }

      // First, create the event with user_id
      const { data: createdEvent, error: createError } = await supabase
        .from("events")
        .insert([{
          ...newEvent,
          user_id: session.user.id,
          is_public: false // Set to false for user-created events
        }])
        .select()
        .single();
      
      if (createError) throw createError;

      // Then trigger the analysis
      const { error: analysisError } = await supabase.functions.invoke('analyze-event', {
        body: { event_id: createdEvent.id }
      });

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        toast({
          title: "Event created",
          description: "Event was created but analysis failed. Please try refreshing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Event created",
          description: "Event has been created and analyzed successfully.",
        });
      }

      // Invalidate the events query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["events"] });

      onOpenChange(false);
      setNewEvent({
        title: "",
        description: "",
        event_type: "NATURAL_DISASTER",
        severity: "LOW",
        city: "",
        country: "",
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: "There was an error creating the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Describe the event"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select
              value={newEvent.event_type}
              onValueChange={(value: EventType) => setNewEvent({ ...newEvent, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
                <SelectItem value="ECONOMIC">Economic</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={newEvent.severity}
              onValueChange={(value: SeverityLevel) => setNewEvent({ ...newEvent, severity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={newEvent.city}
              onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
              placeholder="City"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={newEvent.country}
              onChange={(e) => setNewEvent({ ...newEvent, country: e.target.value })}
              placeholder="Country"
            />
          </div>
          <Button 
            onClick={handleCreateEvent} 
            className="mt-2"
            disabled={isProcessing}
          >
            {isProcessing ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
