import type { NavigationUser } from "./types";

/**
 * Generuje inicjały użytkownika na podstawie imienia i nazwiska lub emaila
 */
export function getInitials(user: NavigationUser): string {
  const fullName = user.user_metadata?.full_name;
  
  if (fullName) {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  
  return user.email.slice(0, 2).toUpperCase();
}

/**
 * Pobiera imię użytkownika do powitania (pierwsze imię lub część emaila przed @)
 */
export function getGreetingName(user: NavigationUser): string {
  const fullName = user.user_metadata?.full_name;
  
  if (fullName) {
    return fullName.split(" ")[0];
  }
  
  return user.email.split("@")[0];
}

/**
 * Pobiera pełną nazwę wyświetlaną użytkownika (pełne imię i nazwisko lub email)
 */
export function getDisplayName(user: NavigationUser): string {
  return user.user_metadata?.full_name || user.email;
}

/**
 * Generuje tekst powitania
 */
export function getGreeting(user: NavigationUser): string {
  return `Witaj, ${getGreetingName(user)}!`;
}

