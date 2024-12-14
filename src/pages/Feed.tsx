import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageCircle, Heart, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes: {
    id: string;
  }[];
  comments: {
    id: string;
  }[];
}

const Feed = () => {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    getSession();
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (username, avatar_url),
          likes (id),
          comments (id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");

      let imageUrl = null;
      if (selectedImage) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(`${userId}/${Date.now()}-${selectedImage.name}`, selectedImage);

        if (uploadError) throw uploadError;
        imageUrl = uploadData.path;
      }

      const { error } = await supabase.from("posts").insert({
        content: newPost,
        user_id: userId,
        image_url: imageUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setNewPost("");
      setSelectedImage(null);
      toast({
        title: "Пост создан",
        description: "Ваш пост успешно опубликован",
      });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error("Not authenticated");

      const { data: existingLike } = await supabase
        .from("likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (existingLike) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedImage(file);
  };

  useEffect(() => {
    const channel = supabase
      .channel("posts-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Что у вас нового?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              {selectedImage && (
                <span className="text-sm text-muted-foreground">
                  {selectedImage.name}
                </span>
              )}
            </div>
            <Button
              onClick={() => createPost.mutate()}
              disabled={!newPost.trim() || createPost.isPending}
            >
              Опубликовать
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts?.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {post.profiles.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{post.profiles.username}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(post.created_at), "d MMMM, HH:mm")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{post.content}</p>
            {post.image_url && (
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/post-images/${post.image_url}`}
                alt="Post image"
                className="mt-4 rounded-lg max-h-96 object-cover"
              />
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex gap-2"
              onClick={() => toggleLike.mutate(post.id)}
            >
              <Heart
                className={`h-4 w-4 ${
                  post.likes.some((like) => like.id === userId)
                    ? "fill-red-500 text-red-500"
                    : ""
                }`}
              />
              {post.likes.length}
            </Button>
            <Button variant="ghost" size="sm" className="flex gap-2">
              <MessageCircle className="h-4 w-4" />
              {post.comments.length}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Feed;