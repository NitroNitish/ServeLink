import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, LayoutDashboard, UtensilsCrossed, Users, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  showNav?: boolean;
}

export const AppHeader = ({ showNav = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ServeLink
            </span>
          </Link>

          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/kitchen">
                <Button variant="ghost" size="sm">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Kitchen
                </Button>
              </Link>
              <Link to="/waiter">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Waiter
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
