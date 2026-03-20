import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Briefcase, Building2, MapPin } from "lucide-react";

export const ProfileSummary = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="bg-[#3b6dae] text-white border-none rounded-3xl overflow-hidden shadow-2xl relative h-87.5 group transition-all duration-700">
      {/* Decorative Brand Elements */}
      <div className="absolute top-0 right-0 w-10 h-10 bg-white/5 rounded-full -mr-20 -mt-20 blur-1xl" />

      <CardContent className="p-4 relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-6">
            <div className="relative">
              {/* Radial Glow */}
              <div className="absolute inset-0 bg-[#c79d2d] rounded-full blur-[20px] opacity-40 animate-pulse" />

              <Avatar className="h-16 w-16 rounded-full shadow-2xl relative z-10 border-2 border-white/10">
                <AvatarImage src={user.profileImage ?? undefined} alt={user.name ?? ""} className="object-cover" />
                <AvatarFallback className="text-lg font-black bg-[#c79d2d] text-white">
                  {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#c79d2d] rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-[#3b6dae]">
                <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                  {user.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-1xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                {user.name || "Guest User"}
              </h3>
              <p className="text-[9px] font-bold text-[#c79d2d] uppercase tracking-[0.2em]">
                {user.email || "centrika.rw"}
              </p>
            </div>
          </div>
          
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-5 px-6 py-4 bg-[#2d5385] rounded-full border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
            <div className="shrink-0 p-3 bg-[#c79d2d] rounded-full text-white shadow-inner">
              <Mail size={16} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-light text-teal-100/30 uppercase tracking-[0.5em] leading-none mb-1.5">Email Address</p>
              <p className="text-sm font-black truncate tracking-tight text-white/90">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 px-8 py-5 bg-[#2d5385] rounded-full border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
            <div className="shrink-0 p-3 bg-white/10 rounded-full text-[#c79d2d] shadow-inner">
              <Building2 size={16} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-light text-teal-100/30 uppercase tracking-[0.5em] leading-none mb-1.5">Department</p>
              <p className="text-sm font-black truncate tracking-tight text-white/90">
                {typeof user.department === 'string' ? user.department : user.department?.name || "Corporate"} 
                <span className="text-white/60 font-medium ml-1">({user.position || "Member"})</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Gloss Effect */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </Card>
  );
};
