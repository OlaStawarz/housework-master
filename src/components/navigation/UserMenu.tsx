import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Trash2 } from "lucide-react";
import type { NavigationUser } from "./types";
import { getInitials, getDisplayName } from "./utils";
import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog";
import { toast } from "sonner";

interface UserMenuProps {
  user: NavigationUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const initials = getInitials(user);
  const displayName = getDisplayName(user);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/";
      } else {
        toast.error("Wystąpił błąd podczas wylogowywania.");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Wystąpił błąd.");
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Menu użytkownika"
          >
            <Avatar className="h-9 w-9 cursor-pointer transition-opacity hover:opacity-80">
              <AvatarImage 
                src={user.user_metadata?.avatar_url} 
                alt={displayName} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user.user_metadata?.avatar_url} 
                alt={displayName} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{displayName}</span>
              {user.user_metadata?.full_name && (
                <span className="text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              setIsDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Usuń konto</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Wyloguj</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAccountDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
    </>
  );
}
