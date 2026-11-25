import type { ReactElement } from "react";

export function SidebarItem({text, icon, onClick}:{
    text: string;
    icon: ReactElement;
    onClick?: () => void;
}){
    return <div onClick={onClick} className="flex items-center text-gray-700 py-2.5 px-3 cursor-pointer hover:bg-gray-100 rounded-lg max-w-56 transition-all duration-200">
        <div className="pr-3 text-gray-500">
            {icon}
        </div>
        <div className="text-base font-medium">
            {text}
        </div>
    </div>
}