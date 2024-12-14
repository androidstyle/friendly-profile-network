import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";

const Messages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        fetchMessages(session.user.id);
      }
    };
    getUser();
  }, []);

  const fetchMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username),
        receiver:profiles!messages_receiver_id_fkey(username)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase
      .from("messages")
      .insert([
        {
          content: newMessage,
          sender_id: currentUserId,
          receiver_id: "REPLACE_WITH_RECEIVER_ID", // This needs to be implemented with actual user selection
        },
      ]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    if (currentUserId) {
      fetchMessages(currentUserId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Сообщения</h1>
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">
                  {message.sender.username} → {message.receiver.username}
                </p>
                <p className="mt-2">{message.content}</p>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Messages;