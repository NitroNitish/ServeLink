import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock, CheckCircle, XCircle, Bell } from "lucide-react";
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
  created_at: string;
  customer_notes: string | null;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    special_instructions: string | null;
    menu_items: { name: string; preparation_time: number | null };
  }>;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  preparing: "bg-primary text-primary-foreground",
  ready: "bg-secondary text-secondary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const Kitchen = () => {
  const { loading: authLoading } = useAuth();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();

    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
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
        order_items (id, quantity, special_instructions, menu_items (name, preparation_time))
      `)
      .eq("restaurant_id", restaurantId)
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (data) {
      setOrders(data.map((o: any) => ({ ...o, table_info: o.restaurant_tables })) as Order[]);
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "ready" ? "✅ Order ready!" : "Updated", description: `Status set to ${status}` });
    }
  };

  if (authLoading || restaurantLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">Real-time order queue</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Bell className="w-3 h-3" />
            {orders.length} active
          </Badge>
        </div>

        {orders.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-20">
              <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">New orders will appear here automatically.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const maxPrepTime = Math.max(...order.order_items.map((i) => i.menu_items.preparation_time || 0));
              return (
                <Card key={order.id} className={`shadow-elegant border-2 ${order.status === "pending" ? "border-accent" : "border-primary"}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">
                          {order.table_info ? `Table ${order.table_info.table_number}` : `#${order.order_number}`}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          {maxPrepTime > 0 && ` · Est. ${maxPrepTime}m`}
                        </p>
                      </div>
                      <Badge className={STATUS_COLOR[order.status]}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start py-1 border-b last:border-0">
                          <div>
                            <p className="font-semibold">{item.quantity}× {item.menu_items.name}</p>
                            {item.special_instructions && (
                              <p className="text-xs text-muted-foreground mt-0.5">↳ {item.special_instructions}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">
                            {item.menu_items.preparation_time || 0}m
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {order.customer_notes && (
                      <p className="text-xs bg-muted rounded px-2 py-1.5">
                        📝 {order.customer_notes}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <Button className="flex-1" onClick={() => updateStatus(order.id, "preparing")}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Start Cooking
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button className="flex-1" onClick={() => updateStatus(order.id, "ready")}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => updateStatus(order.id, "cancelled")}
                        title="Cancel order"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
