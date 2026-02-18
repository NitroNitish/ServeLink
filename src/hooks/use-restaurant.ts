import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRestaurant = () => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // First check if user is a staff member linked to a restaurant
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.restaurant_id && profile.role !== "owner") {
        setRestaurantId(profile.restaurant_id);
        setLoading(false);
        return;
      }

      // Try to find existing restaurant owned by user
      const { data: ownedRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (ownedRestaurant) {
        setRestaurantId(ownedRestaurant.id);
      } else if (profile?.role === "owner" || !profile) {
        // Auto-create one for owner
        const { data: newRestaurant } = await supabase
          .from("restaurants")
          .insert({
            name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Restaurant` : "My Restaurant",
            owner_id: user.id,
          })
          .select("id")
          .single();
        if (newRestaurant) setRestaurantId(newRestaurant.id);
      }
      setLoading(false);
    };
    fetchOrCreate();
  }, []);

  return { restaurantId, loading };
};
