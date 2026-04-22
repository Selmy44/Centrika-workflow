import * as React from "react";
import { X, Check, ChevronsUpDown, Search, User, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Staff {
  id: number;
  name: string;
  position: string;
  profileImage?: string;
}

interface StaffSelectorProps {
  selectedStaffIds: number[];
  onChange: (ids: number[]) => void;
}

export function StaffSelector({ selectedStaffIds, onChange }: StaffSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data: staffResults, isLoading } = trpc.suggestions.searchStaff.useQuery(
    { search: search.length >= 2 ? search : undefined },
    { enabled: true }
  );

  const selectedStaff = staffResults?.filter(s => selectedStaffIds.includes(s.id)) || [];

  const handleUnselect = (id: number) => {
    onChange(selectedStaffIds.filter((s) => s !== id));
  };

  const handleSelect = (id: number) => {
    if (selectedStaffIds.includes(id)) {
      handleUnselect(id);
    } else {
      onChange([...selectedStaffIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#3b6dae]/20">
        {selectedStaffIds.length === 0 && (
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest px-2 self-center">No recipients selected...</span>
        )}
        {selectedStaffIds.map((id) => {
          // We might not have the full staff object in staffResults if it's not in the current search page,
          // but for basic display we can try to find it or show a placeholder.
          // In a real app, you'd fetch the selected staff details specifically.
          const staff = staffResults?.find(s => s.id === id);
          return (
            <Badge
              key={id}
              variant="secondary"
              className="bg-[#3b6dae]/10 text-[#3b6dae] hover:bg-[#3b6dae]/20 border-none rounded-xl px-3 py-1 text-xs font-black flex items-center gap-2 group transition-all"
            >
              {staff?.name || `Staff #${id}`}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-50 group-hover:opacity-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(id);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3b6dae] hover:text-[#2d5385] transition-all bg-[#3b6dae]/5 px-4 py-2 rounded-xl border border-[#3b6dae]/10"
          >
            <UserPlus size={14} />
            Add Recipients
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
          <Command className="dark:bg-slate-900">
            <CommandInput 
              placeholder="Search by name or position..." 
              value={search}
              onValueChange={setSearch}
              className="h-12 border-none focus:ring-0 text-sm"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="p-4 text-center text-xs font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800">
                {isLoading ? "Searching..." : search.length < 2 ? "Type at least 2 letters..." : "No staff found."}
              </CommandEmpty>
              <CommandGroup>
                {staffResults?.map((staff) => (
                  <CommandItem
                    key={staff.id}
                    onSelect={() => {
                        handleSelect(staff.id);
                        setSearch("");
                    }}
                    className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer transition-all",
                        selectedStaffIds.includes(staff.id) && "bg-slate-50 dark:bg-slate-800"
                    )}
                  >
                    <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-slate-100 shadow-sm">
                      <AvatarImage src={staff.profileImage || ""} />
                      <AvatarFallback className="bg-slate-100 text-[#3b6dae] text-[10px] font-black">{(staff.name ?? "S").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{staff.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{staff.position}</p>
                    </div>
                    {selectedStaffIds.includes(staff.id) && (
                      <Check className="h-4 w-4 text-[#3b6dae] shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
