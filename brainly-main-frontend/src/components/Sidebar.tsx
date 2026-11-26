import { Logo } from "../icons/Logo";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { UserIcon } from "../icons/UserIcon";
import { LogoutIcon } from "../icons/LogoutIcon";
import { AllIcon } from "../icons/AllIcon";
import { ArticleIcon } from "../icons/ArticleIcon";
import { LinkedInIcon } from "../icons/LinkedInIcon";
import { InstagramIcon } from "../icons/InstagramIcon";
import { SparklesIcon } from "../icons/SparklesIcon";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  user?: { username?: string; contentCount?: number } | null;
  currentFilter?: "all" | "twitter" | "youtube" | "linkedin" | "instagram" | "link";
  onSelectFilter?: (filter: "all" | "twitter" | "youtube" | "linkedin" | "instagram" | "link") => void;
  onOpenProfile?: () => void;
  onOpenChat?: () => void;
  onLogout?: () => void;
}

export function SideBar({ user, currentFilter = "all", onSelectFilter, onOpenProfile, onOpenChat, onLogout }: SidebarProps) {
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  return (
    <div className="h-screen bg-white border-r w-72 fixed left-0 top-0 flex flex-col justify-between p-6">
      <div>
        <div className="flex items-center text-2xl font-bold text-gray-900 pb-6 border-b border-gray-100">
          <div className="pr-3 text-purple-600">
            <Logo />
          </div>
          MediaNest
        </div>

        {/* AI Second Brain Chat Callout */}
        <div className="pt-5 pb-2">
          <button
            onClick={onOpenChat}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-medium shadow-md shadow-purple-200 hover:shadow-lg hover:from-purple-700 hover:to-indigo-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="size-5 text-amber-300 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold tracking-tight">Chat with NestAI</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white">
              AI
            </span>
          </button>
        </div>

        <div className="pt-3 flex flex-col gap-1">
          <SidebarItem 
            text="All Content" 
            icon={<AllIcon className="size-5" />} 
            active={currentFilter === "all"}
            onClick={() => onSelectFilter && onSelectFilter("all")} 
          />
          <SidebarItem 
            text="Articles / Web" 
            icon={<ArticleIcon className="size-5" />} 
            active={currentFilter === "link"}
            onClick={() => onSelectFilter && onSelectFilter("link")} 
          />
          <SidebarItem 
            text="YouTube" 
            icon={<YoutubeIcon />} 
            active={currentFilter === "youtube"}
            onClick={() => onSelectFilter && onSelectFilter("youtube")} 
          />
          <SidebarItem 
            text="Twitter / X" 
            icon={<TwitterIcon />} 
            active={currentFilter === "twitter"}
            onClick={() => onSelectFilter && onSelectFilter("twitter")} 
          />
          <SidebarItem 
            text="LinkedIn" 
            icon={<LinkedInIcon className="size-5" />} 
            active={currentFilter === "linkedin"}
            onClick={() => onSelectFilter && onSelectFilter("linkedin")} 
          />
          <SidebarItem 
            text="Instagram" 
            icon={<InstagramIcon className="size-5" />} 
            active={currentFilter === "instagram"}
            onClick={() => onSelectFilter && onSelectFilter("instagram")} 
          />
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
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-purple-200">
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
