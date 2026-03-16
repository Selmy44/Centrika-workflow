import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Loader2, ChevronRight, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormatter";

export function PolicyKnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: policies, isLoading } = trpc.policies.list.useQuery();

  const filteredPolicies = policies?.filter((p: any) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Policy Knowledge Base
          </h1>
          <p className="text-slate-500 mt-1">Access company manuals, guides, and official procedures.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search policies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredPolicies?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No policies found</h3>
          <p className="text-slate-500">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies?.map((policy: any) => (
            <Card key={policy.id} className="hover:shadow-lg transition-all duration-300 group border-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100">
                    {policy.category}
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {policy.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {policy.content}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-[11px] text-slate-400">
                    Updated {formatDateTime(policy.lastUpdated)}
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 group-hover:bg-blue-50">
                    Read More
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
