import { Logo } from "../icons/Logo";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { UserIcon } from "../icons/UserIcon";
import { LogoutIcon } from "../icons/LogoutIcon";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  user?: { username?: string; contentCount?: number } | null;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export function SideBar({ user, onOpenProfile, onLogout }: SidebarProps) {
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <div className="h-screen bg-white border-r w-72 fixed left-0 top-0 flex flex-col justify-between p-6">
      <div>
        <div className="flex items-center text-2xl font-bold text-gray-900 pb-8 border-b border-gray-100">
          <div className="pr-3 text-purple-600">
            <Logo />
          </div>
          MediaNest
        </div>
        <div className="pt-6 flex flex-col gap-1">
          <SidebarItem text="Twitter" icon={<TwitterIcon />} />
          <SidebarItem text="Youtube" icon={<YoutubeIcon />} />
          <SidebarItem 
            text="My Profile" 
            icon={<UserIcon className="size-5" />} 
            onClick={onOpenProfile} 
          />
        </div>
      </div>

      {/* User profile footer & logout */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <button 
            onClick={onOpenProfile}
            className="flex items-center gap-3 text-left overflow-hidden flex-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.username || "My Account"}
              </p>
              <p className="text-xs text-gray-500">View Profile</p>
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Log out"
            >
              <LogoutIcon className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}