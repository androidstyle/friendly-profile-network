import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserSelect } from "@/components/messages/UserSelect";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";

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
        <UserSelect
          users={users}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
        />
      </div>

      {selectedUser ? (
        <>
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            messagesEndRef={messagesEndRef}
          />
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSend={() => sendMessage.mutate()}
            isPending={sendMessage.isPending}
          />
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