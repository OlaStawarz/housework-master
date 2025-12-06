import { UserMenu } from "./UserMenu";
import type { NavigationUser } from "./types";
import { getGreeting } from "./utils";

interface UserSectionProps {
  user: NavigationUser;
  showGreeting?: boolean;
}

export function UserSection({ user, showGreeting = true }: UserSectionProps) {
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
