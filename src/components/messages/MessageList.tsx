import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  profiles: Profile;
}

interface MessageListProps {
  messages: Message[] | undefined;
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList = ({ messages, currentUserId, messagesEndRef }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
      {messages?.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-2 ${
            message.sender_id === currentUserId
              ? "flex-row-reverse"
              : "flex-row"
          }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.profiles.avatar_url || undefined} />
            <AvatarFallback>
              {message.profiles.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div
            className={`rounded-lg p-3 max-w-[70%] ${
              message.sender_id === currentUserId
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p className="break-words">{message.content}</p>
            <span className="text-xs opacity-70 mt-1 block">
              {format(new Date(message.created_at), "HH:mm")}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};