import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NavigationUser } from "./types";
import { getInitials, getGreeting, getDisplayName } from "./utils";

interface UserGreetingProps {
  user: NavigationUser;
  size?: "sm" | "md" | "lg";
  showGreeting?: boolean;
}

export function UserGreeting({ user, size = "md", showGreeting = true }: UserGreetingProps) {
  const initials = getInitials(user);
  const greeting = getGreeting(user);
  const displayName = getDisplayName(user);

  const avatarSize = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const fallbackTextSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-sm",
  }[size];

  return (
    <div className="flex items-center gap-3">
      <Avatar className={avatarSize}>
        <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
        <AvatarFallback className={`bg-primary text-primary-foreground font-medium ${fallbackTextSize}`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showGreeting && (
        <span className={`${textSize} font-medium`}>{greeting}</span>
      )}
    </div>
  );
}


