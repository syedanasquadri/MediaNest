import type { ReactElement } from "react";

export function SidebarItem({text, icon, onClick, active}:{
    text: string;
    icon: ReactElement;
    onClick?: () => void;
    active?: boolean;
}){
    return <div onClick={onClick} className={`flex items-center py-2.5 px-3 cursor-pointer rounded-lg max-w-56 transition-all duration-200 ${
        active 
          ? "bg-purple-100 text-purple-700 font-semibold shadow-sm" 
          : "text-gray-700 hover:bg-gray-100 font-medium"
    }`}>
        <div className={`pr-3 ${active ? "text-purple-600" : "text-gray-500"}`}>
            {icon}
        </div>
        <div className="text-base">
            {text}
        </div>
    </div>
}