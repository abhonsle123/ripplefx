
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useProfileData } from "@/hooks/useProfileData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionManagement } from "@/components/profile/SubscriptionManagement";

const Profile = () => {
  const { profile, loading } = useProfileData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card className="p-6">
              <ProfileForm profile={profile} />
            </Card>
          </TabsContent>
          <TabsContent value="subscription">
            <Card className="p-6">
              <SubscriptionManagement profile={profile} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
