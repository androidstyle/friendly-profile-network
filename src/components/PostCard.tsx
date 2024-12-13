import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  };
  currentUserId: string;
  likes: number;
  isLiked: boolean;
  onLikeToggle: () => void;
}

export const PostCard = ({ post, currentUserId, likes, isLiked, onLikeToggle }: PostCardProps) => {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .match({ post_id: post.id, user_id: currentUserId });
    } else {
      await supabase
        .from("likes")
        .insert([{ post_id: post.id, user_id: currentUserId }]);
    }

    onLikeToggle();
    setIsLiking(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center space-x-4 pb-4">
        <Avatar>
          <AvatarImage src={post.profiles.avatar_url || ""} />
          <AvatarFallback>{post.profiles.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.profiles.username}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className="h-5 w-5 mr-1" fill={isLiked ? "currentColor" : "none"} />
          {likes}
        </Button>
      </CardFooter>
    </Card>
  );
};