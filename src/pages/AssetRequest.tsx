import DashboardLayout from "@/components/DashboardLayout";
import AssetRequestForm from "@/components/forms/AssetRequestForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AssetRequest() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/requests">
                        <Button variant="outline" size="icon">
                            <ArrowLeft size={18} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">New Asset Request</h1>
                        <p className="text-muted-foreground mt-1">Submit a request for items or equipment</p>
                    </div>
                </div>

                <AssetRequestForm />
            </div>
        </DashboardLayout>
    );
}
