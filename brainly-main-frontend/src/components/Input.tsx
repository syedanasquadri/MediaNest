import type { Ref, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { 
  placeholder?: string; 
  reference?: Ref<HTMLInputElement>;
}

export function Input({ placeholder, reference, type = "text", className = "", ...props }: InputProps) {
    return (
        <div>
            <input 
                ref={reference} 
                placeholder={placeholder} 
                type={type} 
                className={`px-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${className}`}
                {...props}
            />
        </div>
    );
}