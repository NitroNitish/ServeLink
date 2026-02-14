import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRestaurant = () => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Try to find existing restaurant
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setRestaurantId(data.id);
      } else {
        // Auto-create one
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
