import { Home, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { icon: Home, label: "Лента", path: "/feed" },
    { icon: MessageCircle, label: "Сообщения", path: "/messages" },
    { icon: User, label: "Профиль", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
      <nav className="flex items-center justify-around">
        {items.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 p-3 text-sm",
              location.pathname === path
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};