import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, Phone, Hash } from "lucide-react";

export const ProfileSummary = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="bg-[#3b6dae] text-white border-none rounded-xl overflow-hidden shadow-xl relative group transition-all duration-700">
      <CardContent className="pt-2 px-3 relative flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-full shadow-lg border-2 border-white/10 shrink-0">
            <AvatarImage src={user.profileImage ?? undefined} alt={user.name ?? ""} className="object-cover" />
            <AvatarFallback className="text-xs font-black bg-[#c79d2d] text-white">
              {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="text-xs font-black truncate text-white uppercase tracking-tight">
              {user.name || "Guest User"}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[7px] font-black bg-[#c79d2d] px-1 rounded-sm">
                {user.role === 'admin' ? 'ADMIN' : (user.role || 'MEMBER').toUpperCase()}
              </span>
              <span className="text-[7px] font-black bg-white/10 px-1 rounded-sm text-white/80 border border-white/5 flex items-center gap-0.5">
                <Hash size={7} /> {user.staffId || "----"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
            <Mail size={12} className="text-[#c79d2d] shrink-0" />
            <div className="min-w-0">
               <p className="text-[7px] font-light text-white/40 uppercase tracking-widest leading-none mb-0.5">Email Address</p>
               <p className="text-[11px] font-black truncate text-white/90">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
            <Phone size={12} className="text-[#c79d2d] shrink-0" />
            <div className="min-w-0">
               <p className="text-[7px] font-light text-white/40 uppercase tracking-widest leading-none mb-0.5">Phone Number</p>
               <p className="text-[11px] font-black truncate text-white/90">{user.phoneNumber || "Not Set"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
            <Building2 size={12} className="text-[#c79d2d] shrink-0" />
            <div className="min-w-0">
               <p className="text-[7px] font-light text-white/40 uppercase tracking-widest leading-none mb-0.5">Department</p>
               <p className="text-[11px] font-black truncate text-white/90">
                 {typeof user.department === 'string' ? user.department : user.department?.name || "Corporate"}
                 <span className="text-white/40 ml-1 font-medium text-[9px]">({user.position || "Staff"})</span>
               </p>
            </div>
          </div>

        </div>
      </CardContent>

      {/* Gloss Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </Card>
  );
};
