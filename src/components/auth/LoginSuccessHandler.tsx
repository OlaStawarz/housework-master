import { useEffect } from "react";
import { toast } from "sonner";

export function LoginSuccessHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login_success") === "true") {
      toast.success("Zalogowano pomyślnie");
      
      // Clean up the URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  return null;
}

