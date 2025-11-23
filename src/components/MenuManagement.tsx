import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuItemDialog } from "./MenuItemDialog";
import { CategoryDialog } from "./CategoryDialog";

export const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cats } = await supabase.from("menu_categories").select("*").order("display_order");
    const { data: items } = await supabase.from("menu_items").select("*").order("name");
    if (cats) setCategories(cats);
    if (items) setMenuItems(items);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Item deleted" });
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Category deleted" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button onClick={() => { setSelectedItem(null); setItemDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
        <Button variant="outline" onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}>
          <Folder className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <span>{cat.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedCategory(cat); setCategoryDialogOpen(true); }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <Badge variant={item.is_available ? "default" : "secondary"}>
                  {item.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                  <Badge variant="outline">{item.is_veg ? "Veg" : "Non-Veg"}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSelectedItem(item); setItemDialogOpen(true); }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MenuItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        categories={categories}
        onSuccess={fetchData}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
        onSuccess={fetchData}
      />
    </div>
  );
};
