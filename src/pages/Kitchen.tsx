import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  order_number: string;
  table_id: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  table_info?: { table_number: string } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    special_instructions: string | null;
    menu_items: {
      name: string;
      preparation_time: number | null;
    };
  }>;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        restaurant_tables (table_number),
        order_items (
          *,
          menu_items (name, preparation_time)
        )
      `)
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        table_info: o.restaurant_tables,
      })) as Order[]);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Order ${status}` });
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-500";
      case "preparing": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <p className="text-muted-foreground">Real-time order management</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-16">
              <ChefHat className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
              <p className="text-muted-foreground">Orders will appear here in real-time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-elegant border-2 animate-in fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {order.table_info ? `Table ${order.table_info.table_number}` : `#${order.order_number}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b pb-2">
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {item.menu_items.name}
                          </p>
                          {item.special_instructions && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.menu_items.preparation_time || 0}m
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button
                        className="flex-1"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        className="flex-1"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Ready
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
