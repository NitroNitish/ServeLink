import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Leaf, ChefHat, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean | null;
  preparation_time: number | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Restaurant {
  id: string;
  name: string;
}

const Menu = () => {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantId) fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    setFetching(true);
    const [{ data: restaurantData }, { data: categoriesData }, { data: itemsData }] = await Promise.all([
      supabase.from("restaurants").select("id, name").eq("id", restaurantId!).single(),
      supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId!).eq("is_active", true).order("display_order"),
      supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId!).eq("is_available", true),
    ]);

    if (restaurantData) setRestaurant(restaurantData);
    if (categoriesData) setCategories(categoriesData);
    if (itemsData) setMenuItems(itemsData);

    // Resolve table number → table UUID
    if (tableParam && restaurantId) {
      const { data: tableData } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableParam)
        .maybeSingle();
      if (tableData) setTableId(tableData.id);
    }

    setFetching(false);
  };

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[itemId] > 1) next[itemId]--;
      else delete next[itemId];
      return next;
    });
  };

  const cartTotal = Object.entries(cart).reduce((total, [itemId, qty]) => {
    const item = menuItems.find((i) => i.id === itemId);
    return total + (item?.price || 0) * qty;
  }, 0);

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const placeOrder = async () => {
    if (cartItemsCount === 0) return;
    if (!restaurantId) {
      toast({ title: "Error", description: "Invalid menu link", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const orderPayload: any = {
        order_number: `ORD-${Date.now()}`,
        restaurant_id: restaurantId,
        status: "pending",
        total_amount: cartTotal,
        customer_notes: specialInstructions || null,
      };
      if (tableId) orderPayload.table_id = tableId;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find((i) => i.id === itemId);
        return {
          order_id: orderData.id,
          menu_item_id: itemId,
          quantity,
          unit_price: item?.price || 0,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      toast({
        title: "🎉 Order Placed!",
        description: tableParam
          ? `Your order for Table ${tableParam} has been sent to the kitchen.`
          : "Your order has been received.",
      });
      setCart({});
      setSpecialInstructions("");
      setCartOpen(false);
    } catch (error: any) {
      toast({ title: "Error placing order", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderMenuCard = (item: MenuItem) => (
    <Card key={item.id} className="shadow-card hover:shadow-elegant transition-shadow flex flex-col">
      {item.image_url && (
        <div className="w-full h-44 overflow-hidden rounded-t-lg">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-1.5">
            {item.is_veg && <Leaf className="w-3.5 h-3.5 text-primary shrink-0" />}
            {item.name}
          </CardTitle>
        </div>
        {item.description && (
          <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">₹{item.price}</span>
          {cart[item.id] ? (
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-medium">{cart[item.id]}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => addToCart(item.id)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => addToCart(item.id)}>Add</Button>
          )}
        </div>
        {item.preparation_time && (
          <p className="text-xs text-muted-foreground mt-2">{item.preparation_time} min prep time</p>
        )}
      </CardContent>
    </Card>
  );

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground">Loading menu…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-background pb-28">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">{restaurant?.name || "Menu"}</span>
              {tableParam && <p className="text-xs text-muted-foreground">Table {tableParam}</p>}
            </div>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="relative gap-2" size="sm">
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartItemsCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs absolute -top-2 -right-2 rounded-full">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Your Order{tableParam ? ` – Table ${tableParam}` : ""}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                {cartItemsCount === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {Object.entries(cart).map(([itemId, quantity]) => {
                        const item = menuItems.find((i) => i.id === itemId);
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">₹{item.price} × {quantity}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => removeFromCart(itemId)}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-5 text-center text-sm">{quantity}</span>
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => addToCart(itemId)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Special Instructions</label>
                      <Textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Allergies, preferences…"
                        className="mt-2"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  </>
                )}
              </div>

              {cartItemsCount > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={placeOrder} disabled={loading}>
                    {loading ? "Placing Order…" : "Place Order"}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-6">
        {menuItems.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-16">
              <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Menu Coming Soon</h3>
              <p className="text-muted-foreground">The restaurant is setting up their menu.</p>
            </CardContent>
          </Card>
        ) : categories.length > 0 ? (
          <Tabs defaultValue="all" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4">
              <TabsList className="w-max">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="all">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(renderMenuCard)}
              </div>
            </TabsContent>
            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.filter((i) => i.category_id === cat.id).map(renderMenuCard)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(renderMenuCard)}
          </div>
        )}
      </main>

      {/* Floating Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm p-4 shadow-elegant">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{cartItemsCount} item{cartItemsCount > 1 ? "s" : ""}</p>
              <p className="text-xl font-bold text-primary">₹{cartTotal.toFixed(2)}</p>
            </div>
            <Button size="lg" onClick={() => setCartOpen(true)}>
              View Cart & Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
