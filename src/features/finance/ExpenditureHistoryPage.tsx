import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/dateFormatter";
import { Loader2, DollarSign, User, Building2, Tag, Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

export default function ExpenditureHistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: expenditures, isLoading } = (trpc as any).requests.getExpenditureHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const hasAccess = useMemo(() => {
    return user && ["head_of_finance", "admin", "hr", "ceo_md"].includes(user.role);
  }, [user]);

  // Filter expenditures based on search term
  const filteredExpenditures = useMemo(() => {
    return expenditures?.filter((exp: any) =>
      exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [expenditures, searchTerm]);

  const formatDate = (date: Date | string) => {
    return formatDateTime(date);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const totals = useMemo(() => {
    if (!expenditures) return { rwf: 0, usd: 0, eur: 0 };
    
    return expenditures.reduce(
      (acc: { rwf: number; usd: number; eur: number }, exp: any) => {
        if (exp.currency === "RWF") acc.rwf += exp.amount;
        else if (exp.currency === "USD") acc.usd += exp.amount;
        else if (exp.currency === "EUR") acc.eur += exp.amount;
        return acc;
      },
      { rwf: 0, usd: 0, eur: 0 }
    );
  }, [expenditures]);

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You do not have permission to view expenditure history.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenditure History</h1>
            <p className="text-muted-foreground mt-2">
              Complete record of all approved expenditure requests with detailed information
            </p>
          </div>
          {/* Modern compact search bar */}
          <div className="relative">
            <Input
              placeholder="Search expenditures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 h-10 pl-10 text-sm rounded-lg border border-border bg-muted/50 focus:bg-background transition-colors"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenditures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? "-" : expenditures?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Approved purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount (RWF)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "-" : `${totals.rwf.toLocaleString()} RWF`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rwandan Francs</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Foreign Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-blue-600">
                {isLoading ? "-" : `${totals.usd.toLocaleString()} USD`}
              </div>
              <div className="text-sm font-bold text-purple-600 mt-1">
                {isLoading ? "-" : `${totals.eur.toLocaleString()} EUR`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenditure List */}
        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={24} />
              </div>
            </CardContent>
          </Card>
        ) : !filteredExpenditures || filteredExpenditures.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? "No expenditure requests match your search." : "No approved expenditure requests found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExpenditures.map((expenditure: any) => (
              <Link key={expenditure.id} href={`/requests/${expenditure.id}`}>
                <Card className="bg-card border-border hover:border-accent transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header with Title and Amount */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="text-green-400" size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-lg">{expenditure.title}</h3>
                            {expenditure.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {expenditure.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(expenditure.amount, expenditure.currency)}
                          </p>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-2">
                            Approved
                          </Badge>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground" size={16} />
                          <div>
                            <p className="text-xs text-muted-foreground">Requested By</p>
                            <p className="text-sm font-medium text-foreground">
                              {expenditure.requester.name || "Unknown"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building2 className="text-muted-foreground" size={16} />
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium text-foreground">
                              {expenditure.department || expenditure.requester.department || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tag className="text-muted-foreground" size={16} />
                          <div>
                            <p className="text-xs text-muted-foreground">Category</p>
                            <p className="text-sm font-medium text-foreground">
                              {expenditure.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground" size={16} />
                          <div>
                            <p className="text-xs text-muted-foreground">Approved On</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatDate(expenditure.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer with Request ID */}
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <span>Request ID: #{expenditure.id}</span>
                        <span>Submitted: {formatDate(expenditure.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
