
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";

function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="w-full h-screen flex">
            <aside className={`transition-all duration-300 ease-in-out ${collapsed ? "w-14" : "w-52"}`} >
                <Sidebar collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)} />
            </aside>

            <div className={`${collapsed ? "w-[calc(100%-56px)]" : "w-[calc(100%-208px)]" } flex flex-col`}>
                <Header />

                <main className="flex-1 overflow-auto p-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
