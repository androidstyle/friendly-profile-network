import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Send } from "lucide-react";

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

const Messages = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: session } = await supabase.auth.getSession();
  const currentUserId = session?.session?.user?.id;

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          profiles!messages_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `
        )
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedUser,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !selectedUser) throw new Error("Not authenticated");
      const { error } = await supabase.from("messages").insert({
        content: newMessage,
        sender_id: currentUserId,
        receiver_id: selectedUser,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedUser] });
      setNewMessage("");
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          if (selectedUser) {
            queryClient.invalidateQueries({
              queryKey: ["messages", selectedUser],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4">
      <div className="mb-4">
        <Select
          value={selectedUser || ""}
          onValueChange={(value) => setSelectedUser(value)}
        >
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
      </div>

      {selectedUser ? (
        <>
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
                  <AvatarImage
                    src={message.profiles.avatar_url || undefined}
                  />
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
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                  e.preventDefault();
                  sendMessage.mutate();
                }
              }}
            />
            <Button
              size="icon"
              onClick={() => sendMessage.mutate()}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Выберите собеседника, чтобы начать чат
        </div>
      )}
    </div>
  );
};

export default Messages;