import type { ReactElement } from "react";

export function SidebarItem({text, icon}:{
    text: string;
    icon: ReactElement;
}){
    return <div className="flex items-center text-gray-700 py-2 cursor-pointer hover:bg-gray-300 rounded max-w-48 pl-2 transition-all duration-300">
        <div className="pr-2">
            {icon}
        </div>
        <div className="text-xl">
            {text}
        </div>
        
    </div>
}