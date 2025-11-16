import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, LogOut, BarChart3, UtensilsCrossed, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Signed out successfully" });
      navigate("/");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ServeLink
            </span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your restaurant operations.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders Today</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Start taking orders to see stats</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Add items to your menu</p>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Set up your tables</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Button className="w-full justify-start h-auto py-4 px-6" variant="outline">
                  <div className="text-left">
                    <div className="font-semibold">Add Menu Items</div>
                    <div className="text-sm text-muted-foreground">Create your digital menu</div>
                  </div>
                </Button>
                <Button className="w-full justify-start h-auto py-4 px-6" variant="outline">
                  <div className="text-left">
                    <div className="font-semibold">Setup Tables</div>
                    <div className="text-sm text-muted-foreground">Generate QR codes for tables</div>
                  </div>
                </Button>
                <Button className="w-full justify-start h-auto py-4 px-6" variant="outline">
                  <div className="text-left">
                    <div className="font-semibold">View Orders</div>
                    <div className="text-sm text-muted-foreground">Monitor incoming orders</div>
                  </div>
                </Button>
                <Button className="w-full justify-start h-auto py-4 px-6" variant="outline">
                  <div className="text-left">
                    <div className="font-semibold">Kitchen Display</div>
                    <div className="text-sm text-muted-foreground">Real-time order tracking</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Menu Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No menu items yet</p>
                  <Button>Add Your First Item</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Table Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No tables configured</p>
                  <Button>Add Tables</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
