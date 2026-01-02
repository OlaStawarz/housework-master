// Typy dla komponentów nawigacyjnych

export interface NavigationUser {
  email: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
}

export interface NavigationProps {
  user: NavigationUser | null;
  currentPath: string;
}

export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}
