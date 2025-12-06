import { Home, LayoutGrid } from "lucide-react";
import { Logo } from "./Logo";
import { UserSection } from "./UserSection";
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

export function DesktopNavigation({ user, currentPath }: NavigationProps) {
  const navLinks = getNavLinks(currentPath);

  return (
    <header className="sticky top-0 z-50 hidden w-full border-b bg-background sm:block">
      <div className="flex h-16 items-center justify-between px-4">
        <Logo size="md" />

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  link.isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* User Section */}
        <UserSection user={user} />
      </div>
    </header>
  );
}
