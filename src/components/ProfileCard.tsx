interface ProfileCardProps {
  user: {
    name?: string;
    email?: string;
    department?: string | { name: string };
    position?: string;
    role?: string;
    profileImage?: string;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name?: string) => {
    if (!name) return "from-slate-700 to-slate-900";

    const gradients = [
      "from-blue-600 to-indigo-600",
      "from-indigo-600 to-purple-600",
      "from-slate-700 to-slate-900",
      "from-teal-600 to-cyan-600",
      "from-blue-700 to-slate-800",
    ];

    const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
    return gradients[hash % gradients.length];
  };

  const initials = getInitials(user?.name);
  const avatarGradient = getAvatarColor(user?.name);
  
  // Safely get department name
  const departmentName = typeof user?.department === 'object' 
    ? user.department.name 
    : user?.department;

  return (
    <div className="relative rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-xl shadow-lg p-8 overflow-hidden mr-0">
      
      {/* Subtle Background Accent */}
      <div className="absolute inset-0 bg-linear-to-br from-gray-50 via-white to-gray-100 opacity-70 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-8">
        
        {/* Left Section */}
        <div className="flex items-center gap-6">
          
          {/* Floating Avatar */}
          <div
            className={`w-24 h-24 rounded-3xl ${user?.profileImage ? '' : `bg-linear-to-br ${avatarGradient}`} flex items-center justify-center text-white text-3xl font-semibold shadow-xl ring-4 ring-white overflow-hidden`}
          >
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Main Info */}
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
              {user?.name || "User"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {user?.email || "No email available"}
            </p>

            <div className="mt-5 flex items-center gap-6">
              
              {user?.position && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Position
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {user.position}
                  </p>
                </div>
              )}

              {departmentName && user?.position && (
                <div className="w-px h-12 bg-gray-300"></div>
              )}

              {departmentName && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    Department
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {departmentName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div>
          {/* Reserved for future content */}
        </div>
      </div>
    </div>
  );
}
