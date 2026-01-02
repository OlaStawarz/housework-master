import { useState } from "react";
import { Home, LayoutGrid, Menu, LogOut, Trash2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { UserGreeting } from "./UserGreeting";
import type { NavigationProps, NavLink } from "./types";
import { DeleteAccountDialog } from "@/components/auth/DeleteAccountDialog";
import { toast } from "sonner";

function getNavLinks(currentPath: string): NavLink[] {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: currentPath === "/dashboard" || currentPath === "/",
    },
    {
      label: "Przestrzenie",
      href: "/spaces",
      icon: LayoutGrid,
      isActive: currentPath.startsWith("/spaces"),
    },
  ];
}

export function MobileNavigation({ user, currentPath }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navLinks = getNavLinks(currentPath);

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

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    // Short delay to allow sheet to close smoothly before dialog opens
    setTimeout(() => setIsDeleteDialogOpen(true), 300);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background sm:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo size="sm" />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Otwórz menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col p-0">
              {/* User Header */}
              <SheetHeader className="border-b p-4">
                <SheetTitle>
                  {user ? (
                    <UserGreeting user={user} size="lg" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">Witaj!</span>
                    </div>
                  )}
                </SheetTitle>
              </SheetHeader>

              {/* Navigation Links */}
              <nav className="flex flex-1 flex-col gap-1 p-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                        link.isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      {link.label}
                    </a>
                  );
                })}
              </nav>

              {/* User Actions at Bottom */}
              <div className="border-t p-4">
                <div className="flex flex-col gap-1">
                  {user ? (
                    <>
                      <button
                        onClick={handleOpenDeleteDialog}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-5 w-5" />
                        Usuń konto
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <LogOut className="h-5 w-5" />
                        Wyloguj
                      </button>
                    </>
                  ) : (
                    <Button asChild className="w-full justify-start gap-3" onClick={() => setIsOpen(false)}>
                      <a href="/login">
                        <LogIn className="h-5 w-5" />
                        Zaloguj się
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <DeleteAccountDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
    </>
  );
}
