import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 bg-background font-sans overflow-x-hidden">
      <div className="text-center space-y-6 md:space-y-10 max-w-2xl mx-auto flex flex-col items-center">
        <div className="animate-in fade-in zoom-in duration-700">
          <img
            src="/logo.png"
            alt="AcadLink Logo"
            className="h-24 md:h-44 mb-2 md:mb-8 object-contain transition-all hover:scale-105 duration-300"
          />
          <h1 className="sr-only">AcadLink</h1>
        </div>

        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom duration-700 delay-200 fill-mode-both">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground px-4 leading-tight">
            Academic Management <span className="text-primary block md:inline">Reimagined</span>
          </h2>

          <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto px-4">
            The unified portal for students, faculty, and parents to track academic progress and stay connected.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-8 md:pt-12 w-full max-w-xs sm:max-w-none px-6 animate-in slide-in-from-bottom duration-700 delay-500 fill-mode-both">
          <Button
            size="lg"
            className="gap-2 w-full sm:w-auto text-base h-12 md:h-14 px-8 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
            onClick={() => navigate("/login")}
          >
            Sign In to Portal <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base h-12 md:h-14 px-8 border-2 transition-all hover:bg-accent"
          >
            Learn More
          </Button>
        </div>
      </div>

      <footer className="mt-24 text-sm text-muted-foreground font-medium animate-in fade-in duration-1000 delay-700 fill-mode-both">
        © 2026 AcadLink. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
