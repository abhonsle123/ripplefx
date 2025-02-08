
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BasicProfileInfoProps = {
  email: string | null;
  username: string | null;
  fullName: string | null;
  onUsernameChange: (username: string) => void;
  onFullNameChange: (fullName: string) => void;
};

export const BasicProfileInfo = ({
  email,
  username,
  fullName,
  onUsernameChange,
  onFullNameChange,
}: BasicProfileInfoProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="email">Account Email (Login)</Label>
        <Input
          id="email"
          type="email"
          value={email || ""}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username || ""}
          onChange={(e) => onUsernameChange(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName || ""}
          onChange={(e) => onFullNameChange(e.target.value)}
        />
      </div>
    </div>
  );
};
