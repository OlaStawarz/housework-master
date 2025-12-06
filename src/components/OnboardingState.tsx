import { Button } from "@/components/ui/button";

interface OnboardingStateProps {
  onCreateSpace: () => void;
}

export function OnboardingState({ onCreateSpace }: OnboardingStateProps) {
  const handleCreateSpace = () => {
    // Przekierowanie na /spaces z parametrem openModal
    window.location.href = "/spaces?openModal=true";
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto">
      <div className="text-8xl mb-8" role="img" aria-label="Witaj">
        👋
      </div>
      <h2 className="text-3xl font-bold mb-4">Witaj w Housework Master!</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Zacznij od stworzenia swojej pierwszej przestrzeni, w której zdefiniujesz obowiązki domowe.
      </p>
      <Button size="lg" onClick={handleCreateSpace}>
        Stwórz swoją pierwszą przestrzeń
      </Button>
    </div>
  );
}

