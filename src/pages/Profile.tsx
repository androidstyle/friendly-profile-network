import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Profile = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });

  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast({
        title: "Профиль обновлен",
        description: "Ваши изменения успешно сохранены",
      });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return <div className="flex items-center justify-center h-full">Загрузка...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки профиля</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("avatar-upload")?.click()}
              >
                Изменить аватар
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={profile.username || ""}
              onChange={(e) =>
                updateProfile.mutate({ username: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Полное имя</Label>
            <Input
              id="full_name"
              value={profile.full_name || ""}
              onChange={(e) =>
                updateProfile.mutate({ full_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => updateProfile.mutate({ bio: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;