import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface UserSelectProps {
  users: Profile[] | undefined;
  selectedUser: string | null;
  onUserSelect: (userId: string) => void;
}

export const UserSelect = ({ users, selectedUser, onUserSelect }: UserSelectProps) => {
  return (
    <Select value={selectedUser || ""} onValueChange={onUserSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Выберите собеседника" />
      </SelectTrigger>
      <SelectContent>
        {users?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {user.username}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};