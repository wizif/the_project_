"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import axios from "@/lib/axios";
import {
  Home,
  Briefcase,
  Users,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({ href, icon: Icon, label, isCollapsed }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className="w-full">
      <div
        className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
          isActive ? "bg-blue-50 dark:bg-gray-700" : ""
        } justify-start px-8 py-3`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
        )}
        <Icon className={`h-6 w-6 text-gray-800 dark:text-gray-100 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
        {!isCollapsed && (
          <span className={`font-medium text-gray-800 dark:text-gray-100 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}>
            {label}
          </span>
        )}
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [showProjects, setShowProjects] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null); // ✅ ADDED

  useEffect(() => {
    // ✅ ADDED: Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    fetchProjects();

    // ✅ FIX: Auto-refresh projects every 3 seconds to update deleted projects
    const interval = setInterval(() => {
      fetchProjects();
    }, 3000);

    // ✅ Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/projects");
      setProjects(response.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // ✅ FIXED: Properly clear localStorage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still logout on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push("/login");
    }
  };

  const sidebarClassNames = `fixed flex flex-col h-full justify-between shadow-xl transition-all duration-300 z-40 dark:bg-gray-900 overflow-y-auto bg-white ${
    isSidebarCollapsed ? "w-0 hidden" : "w-64"
  }`;

  // ✅ ADDED: Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className={sidebarClassNames}>
      <div className="flex h-full w-full flex-col justify-start">
        {/* Top Logo */}
        <div className="z-50 flex min-h-[56px] w-64 items-center justify-between bg-white px-6 pt-3 dark:bg-gray-900">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            WorkFlow App
          </div>
          {!isSidebarCollapsed && (
            <button
              className="py-3"
              onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
            >
              <X className="h-6 w-6 text-gray-800 hover:text-gray-500 dark:text-white" />
            </button>
          )}
        </div>

        {/* Navbar Links */}
        <nav className="z-10 w-full mt-4">
          {/* ✅ UPDATED: Role-based dashboard route */}
          <SidebarLink
            icon={Home}
            label="Dashboard"
            href={isAdmin ? "/admin/dashboard" : "/dashboard"}
            isCollapsed={isSidebarCollapsed}
          />
          
          <SidebarLink
            icon={Briefcase}
            label="Projects"
            href="/projects"
            isCollapsed={isSidebarCollapsed}
          />
          
          {/* ✅ ADMIN ONLY: Analytics */}
          {isAdmin && (
            <SidebarLink
              icon={BarChart3}
              label="Analytics"
              href="/admin/analytics"
              isCollapsed={isSidebarCollapsed}
            />
          )}
          
          {/* ✅ ADMIN ONLY: Users */}
          {isAdmin && (
            <SidebarLink
              icon={Users}
              label="Users"
              href="/admin/users"
              isCollapsed={isSidebarCollapsed}
            />
          )}
          
          {/* ✅ ADMIN ONLY: Teams */}
          {isAdmin && (
            <SidebarLink
              icon={Users}
              label="Teams"
              href="/admin/teams"
              isCollapsed={isSidebarCollapsed}
            />
          )}
          
          {/* ✅ ADMIN ONLY: Audit Logs */}
          {isAdmin && (
            <SidebarLink
              icon={FileText}
              label="Audit Logs"
              href="/admin/audit-logs"
              isCollapsed={isSidebarCollapsed}
            />
          )}
          
          <SidebarLink
            icon={Settings}
            label="Settings"
            href="/settings"
            isCollapsed={isSidebarCollapsed}
          />
        </nav>

        {/* Projects Section */}
        {!isSidebarCollapsed && (
          <div className="px-8 py-4">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="flex w-full items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200"
            >
              <span>Projects</span>
              {showProjects ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {showProjects && (
              <div className="mt-2 space-y-1">
                {projects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                  >
                    {project.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <div className="mt-auto px-8 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 py-3 text-gray-800 hover:bg-red-50 dark:text-gray-100 dark:hover:bg-red-900/20 rounded px-4"
          >
            <LogOut className="h-6 w-6" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
