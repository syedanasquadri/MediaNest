import { useRef, type InputHTMLAttributes } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { BACKEND_URL } from "../config";
import { data, useNavigate } from "react-router-dom";
import axios from "axios";

export function Signup(){
    const usernameRef = useRef<HTMLInputElement>();
    const passwordRef = useRef<HTMLInputElement>();
    const navigate = useNavigate();

    async function signup(){
        const username = usernameRef.current?.value;
        const password = passwordRef.current?.value;
        console.log(usernameRef.current);

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password
        })
        navigate("/signin");
        alert("You have signed up");
    }

    return <div className="h-screen w-screen justify-center items-center bg-gray-200 flex">
        <div className="bg-white rounded-xl p-8 border min-w-48">
            <Input reference={usernameRef} placeholder="Username" />
            <Input reference={passwordRef} placeholder="Password" />
            <div className="flex justify-center pt-4">
                <Button onClick={signup} variant="primary" text="Signup" fullWidth={true} loading={false}/>
            </div>
        </div>
    </div>
}