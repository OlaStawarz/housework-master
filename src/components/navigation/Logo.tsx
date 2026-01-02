import { Home } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const containerSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <a href="/dashboard" className="flex items-center gap-2">
      <div className={`flex ${containerSize} items-center justify-center rounded-lg bg-primary text-primary-foreground`}>
        <Home className={iconSize} />
      </div>
      {showText && (
        <span className={`${textSize} font-semibold tracking-tight`}>
          Housework Master
        </span>
      )}
    </a>
  );
}


