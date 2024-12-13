import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const CreatePost = ({ onPostCreated }: { onPostCreated: () => void }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("posts")
      .insert([{ content, user_id: session.user.id }]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать пост",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Пост создан",
      });
      setContent("");
      onPostCreated();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <Textarea
        placeholder="Что у вас нового?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
      />
      <Button type="submit" disabled={isLoading || !content.trim()}>
        {isLoading ? "Публикация..." : "Опубликовать"}
      </Button>
    </form>
  );
};