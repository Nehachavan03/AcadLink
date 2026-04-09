import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center space-y-6 max-w-2xl mx-auto flex flex-col items-center">
        <img src="/logo.png" alt="AcadLink Logo" className="h-32 mb-4 object-contain" />
        <h1 className="text-4xl font-bold tracking-tight sr-only">AcadLink</h1>


        <h2 className="text-3xl font-semibold text-muted-foreground">
          Academic Management Reimagined
        </h2>

        <p className="text-lg text-muted-foreground leading-relaxed">
          The unified portal for students, faculty, and parents to track academic progress,
          manage assignments, and stay connected with the institution.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate("/login")}
          >
            Sign In to Portal <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
          >
            Learn More
          </Button>
        </div>
      </div>

      <footer className="mt-20 text-sm text-muted-foreground">
        © 2026 AcadLink. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
