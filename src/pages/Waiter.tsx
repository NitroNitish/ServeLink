import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CheckCircle, Clock, Bell } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number | null;
  created_at: string;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    quantity: number;
    menu_items: { name: string };
  }>;
}

const Waiter = () => {
  const { loading: authLoading } = useAuth();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();

    const channel = supabase
      .channel("waiter-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        restaurant_tables (table_number),
        order_items (quantity, menu_items (name))
      `)
      .eq("restaurant_id", restaurantId)
      .not("status", "in", '("cancelled")')
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data.map((o: any) => ({ ...o, table_info: o.restaurant_tables })) as Order[]);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Order marked as ${status}` });
    }
  };

  const filterOrders = (statuses: OrderStatus[]) => orders.filter((o) => statuses.includes(o.status));
  const getLabel = (order: Order) =>
    order.table_info ? `Table ${order.table_info.table_number}` : `#${order.order_number}`;

  const renderCard = (order: Order, actions?: React.ReactNode) => (
    <Card key={order.id} className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{getLabel(order)}</CardTitle>
          <Badge
          className={
            order.status === "ready"
              ? "bg-primary"
              : order.status === "preparing"
              ? "bg-secondary"
              : "bg-accent"
          }
          >
            {order.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {order.order_items.map((item, idx) => (
            <p key={idx} className="text-sm">{item.quantity}× {item.menu_items.name}</p>
          ))}
        </div>
        {order.total_amount && (
          <p className="text-base font-bold text-primary">₹{order.total_amount.toFixed(2)}</p>
        )}
        {actions}
      </CardContent>
    </Card>
  );

  if (authLoading || restaurantLoading) return null;

  const readyOrders = filterOrders(["ready"]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Waiter Panel</h1>
              <p className="text-sm text-muted-foreground">Table service management</p>
            </div>
          </div>
          {readyOrders.length > 0 && (
            <Badge className="bg-primary gap-1 text-sm">
              <Bell className="w-3 h-3" />
              {readyOrders.length} ready to serve
            </Badge>
          )}
        </div>

        <Tabs defaultValue="ready" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ready">
              Ready to Serve {readyOrders.length > 0 && `(${readyOrders.length})`}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterOrders(["pending", "preparing"]).length})
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="ready">
            {readyOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No orders ready to serve.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) =>
                  renderCard(
                    order,
                    <Button className="w-full" onClick={() => updateStatus(order.id, "completed")}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Served
                    </Button>
                  )
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOrders(["pending", "preparing"]).map((order) => renderCard(order))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOrders(["completed"]).map((order) => renderCard(order))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Waiter;
