import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { useToast } from "@/components/ui/use-toast";

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить посты",
        variant: "destructive",
      });
      return;
    }

    setPosts(data);
    await fetchLikes();
  };

  const fetchLikes = async () => {
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id, user_id");

    if (likesData) {
      const likesCount: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};

      likesData.forEach((like) => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
        if (like.user_id === currentUserId) {
          userLikes[like.post_id] = true;
        }
      });

      setLikes(likesCount);
      setLikedPosts(userLikes);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
      await fetchPosts();
      setIsLoading(false);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setCurrentUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-8">Лента новостей</h1>
      <CreatePost onPostCreated={fetchPosts} />
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId!}
            likes={likes[post.id] || 0}
            isLiked={likedPosts[post.id] || false}
            onLikeToggle={fetchLikes}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-gray-500">Пока нет постов</p>
        )}
      </div>
    </div>
  );
};

export default Feed;