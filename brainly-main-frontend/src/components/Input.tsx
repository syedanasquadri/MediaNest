import type { Ref } from "react";

interface InputProps { 
  placeholder: string; 
  reference?: Ref<HTMLInputElement>;
  type?: string;
}

export function Input({placeholder, reference, type = "text"}: InputProps) {
    return <div>
        <input ref={reference} placeholder={placeholder} type={type} className="px-4 py-2 border rounded-lg m-2" />
    </div>
}