import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  categories: any[];
  restaurantId: string;
  onSuccess: () => void;
}

const defaultForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  is_veg: true,
  is_available: true,
  preparation_time: 15,
  image_url: "",
};

export const MenuItemDialog = ({ open, onOpenChange, item, categories, restaurantId, onSuccess }: MenuItemDialogProps) => {
  const [formData, setFormData] = useState({ ...defaultForm });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when item changes (handles both add and edit)
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        price: item.price?.toString() || "",
        category_id: item.category_id || "",
        is_veg: item.is_veg ?? true,
        is_available: item.is_available ?? true,
        preparation_time: item.preparation_time || 15,
        image_url: item.image_url || "",
      });
    } else {
      setFormData({ ...defaultForm });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast({ title: "Validation Error", description: "Name and price are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      preparation_time: Number(formData.preparation_time),
      category_id: formData.category_id || null,
      image_url: formData.image_url.trim() || null,
      is_veg: formData.is_veg,
      is_available: formData.is_available,
      restaurant_id: restaurantId,
    };

    const { error } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Item ${item ? "updated" : "added"} successfully` });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="prep_time">Prep Time (mins)</Label>
              <Input
                id="prep_time"
                type="number"
                min="1"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 15 })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Switch
                id="veg"
                checked={formData.is_veg}
                onCheckedChange={(checked) => setFormData({ ...formData, is_veg: checked })}
              />
              <Label htmlFor="veg">Vegetarian</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <Label htmlFor="available">Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : item ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
