import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout(){
    return(
        <div className="min-h-screen bg-brand-bg">
            <Navbar/>
            <main>
                <Outlet/>
            </main>
        </div>
    );
}