import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface TableManagementProps {
  restaurantId: string;
}

export const TableManagement = ({ restaurantId }: TableManagementProps) => {
  const [tables, setTables] = useState<any[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number");
    if (data) setTables(data);
  };

  const addTable = async () => {
    if (!newTableNumber) return;

    const qrData = `${window.location.origin}/menu/${restaurantId}?table=${newTableNumber}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const { error } = await supabase.from("restaurant_tables").insert({
      table_number: newTableNumber,
      capacity: parseInt(newCapacity),
      qr_code: qrCode,
      restaurant_id: restaurantId,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Table added successfully" });
      setNewTableNumber("");
      setNewCapacity("4");
      fetchTables();
    }
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Table deleted" });
      fetchTables();
    }
  };

  const downloadQR = (qrCode: string, tableNumber: string) => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `table-${tableNumber}-qr.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Add New Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input placeholder="Table Number (e.g., T1)" value={newTableNumber} onChange={(e) => setNewTableNumber(e.target.value)} />
            <Input type="number" placeholder="Capacity" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} className="w-32" />
            <Button onClick={addTable}>
              <Plus className="w-4 h-4 mr-2" /> Add Table
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <Card key={table.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Table {table.table_number}</CardTitle>
                <Badge variant="outline">Capacity: {table.capacity}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {table.qr_code && (
                <div className="flex justify-center">
                  <img src={table.qr_code} alt={`QR for ${table.table_number}`} className="w-48 h-48" />
                </div>
              )}
              <div className="flex gap-2">
                {table.qr_code && (
                  <Button variant="outline" className="flex-1" onClick={() => downloadQR(table.qr_code!, table.table_number)}>
                    <QrCode className="w-4 h-4 mr-2" /> Download QR
                  </Button>
                )}
                <Button variant="destructive" size="icon" onClick={() => deleteTable(table.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
