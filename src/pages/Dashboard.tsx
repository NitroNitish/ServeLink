import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuManagement } from "@/components/MenuManagement";
import { TableManagement } from "@/components/TableManagement";
import { OrdersManagement } from "@/components/OrdersManagement";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { AppHeader } from "@/components/AppHeader";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const { loading: authLoading } = useAuth();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Manage your restaurant operations from one place.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="tables">Tables & QR</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsDashboard restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="tables">
            <TableManagement restaurantId={restaurantId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
