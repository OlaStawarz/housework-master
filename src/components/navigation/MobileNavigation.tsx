import { useState } from "react";
import { Home, LayoutGrid, Menu, User, LogOut } from "lucide-react";
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
  const navLinks = getNavLinks(currentPath);

  const handleSignOut = () => {
    // TODO: Implementacja wylogowania po dodaniu autoryzacji
    console.log("Wylogowanie - placeholder");
    setIsOpen(false);
  };

  return (
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
                <UserGreeting user={user} size="lg" />
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
                <button
                  disabled
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  <User className="h-5 w-5" />
                  Profil
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  Wyloguj
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
