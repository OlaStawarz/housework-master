import { UserMenu } from "./UserMenu";
import type { NavigationUser } from "./types";
import { getGreeting } from "./utils";
import { Button } from "@/components/ui/button";

interface UserSectionProps {
  user: NavigationUser | null;
  showGreeting?: boolean;
}

export function UserSection({ user, showGreeting = true }: UserSectionProps) {
  if (!user) {
    return (
      <Button asChild variant="default" size="sm">
        <a href="/login">Zaloguj</a>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showGreeting && (
        <span className="hidden text-sm text-muted-foreground md:block">
          {getGreeting(user)}
        </span>
      )}
      <UserMenu user={user} />
    </div>
  );
}
