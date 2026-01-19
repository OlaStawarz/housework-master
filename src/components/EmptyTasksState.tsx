import { Coffee, Sparkles } from "lucide-react";

export function EmptyTasksState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative mb-8 group cursor-default">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon container */}
        <div className="relative bg-card p-8 rounded-full border-2 border-primary/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          <Coffee className="w-16 h-16 text-primary" strokeWidth={1.5} />
          
          {/* Floating sparkles */}
          <div className="absolute -top-2 -right-2 bg-background p-2 rounded-full shadow-lg border border-border animate-bounce delay-100">
             <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold mb-3 tracking-tight text-foreground">
        Wszystko lśni!
      </h2>
      
      <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
        Świetna robota! Nie masz żadnych zadań na teraz.
        <br />
        Czas na zasłużony odpoczynek. ☕
      </p>
    </div>
  );
}
