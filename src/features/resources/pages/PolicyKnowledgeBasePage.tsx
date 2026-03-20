import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
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
    <DashboardLayout>
      <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#3b6dae]" />
              Policy Knowledge Base
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Access company manuals, guides, and official procedures.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search policies..."
              className="rounded-xl border-border/50 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3b6dae]" />
          </div>
        ) : filteredPolicies?.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border/50">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No policies found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies?.map((policy: any) => (
              <Card key={policy.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-[#3b6dae]/10 text-[#3b6dae] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#3b6dae]/20">
                      {policy.category}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-[#3b6dae] transition-colors">
                    {policy.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-sm">
                    {policy.content}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Updated {formatDateTime(policy.lastUpdated)}
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#3b6dae] group-hover:bg-[#3b6dae]/10 rounded-xl">
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
    </DashboardLayout>
  );
}
