import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/AppSidebar";

export function AppLayout() {
  return (
    <div className="app">
      <AppSidebar />
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
