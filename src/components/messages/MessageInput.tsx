import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export const MessageInput = ({
  newMessage,
  setNewMessage,
  onSend,
  isPending,
}: MessageInputProps) => {
  return (
    <div className="flex gap-2">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Введите сообщение..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={!newMessage.trim() || isPending}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};