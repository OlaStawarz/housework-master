import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import type { NavigationProps } from "./types";

export function NavigationContainer({ user, currentPath }: NavigationProps) {
  return (
    <>
      <DesktopNavigation user={user} currentPath={currentPath} />
      <MobileNavigation user={user} currentPath={currentPath} />
    </>
  );
}

