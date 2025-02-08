
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function queueNotificationForHighImpactEvent(eventId: string, riskLevel: string) {
  if (riskLevel === 'high' || riskLevel === 'critical') {
    const { error: notificationError } = await supabase
      .from('notification_queue')
      .insert([{ 
        event_id: eventId,
        processed: false
      }]);

    if (notificationError) {
      console.error("Error queueing notification:", notificationError);
      throw notificationError;
    }
  }
}
