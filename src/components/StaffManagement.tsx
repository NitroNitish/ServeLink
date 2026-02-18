import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, UserPlus } from "lucide-react";

interface StaffProfile {
    id: string;
    full_name: string | null;
    role: string | null;
    access_token: string | null;
}

export const StaffManagement = ({ restaurantId }: { restaurantId: string }) => {
    const [staff, setStaff] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchStaff();
    }, [restaurantId]);

    const fetchStaff = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("restaurant_id", restaurantId);

        if (data) setStaff(data);
        setLoading(false);
    };

    const generateLink = (profile: StaffProfile) => {
        const role = profile.role || "staff";
        const url = `${window.location.origin}/${role}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: `Direct link to ${role} panel copied.` });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Staff Management</h2>
                    <p className="text-sm text-muted-foreground">Manage your kitchen and waiter staff access.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Restaurant Staff</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Access Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No staff members assigned yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.full_name || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === "kitchen" ? "secondary" : "outline"}>
                                                {member.role === "owner" ? "Owner" : member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.role !== "owner" && (
                                                <Button variant="outline" size="sm" onClick={() => generateLink(member)}>
                                                    <Copy className="w-3 h-3 mr-2" />
                                                    Copy Panel Link
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="bg-muted/50 border-dashed">
                <CardContent className="py-6">
                    <div className="text-center space-y-3">
                        <UserPlus className="w-8 h-8 mx-auto text-muted-foreground" />
                        <h3 className="font-medium">Add New Staff</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            To add staff, they must first create an account on ServeLink. Once they have an account, you can assign them to your restaurant and set their role via the Supabase Dashboard or by providing their email to the administrator.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
