"use client";

import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Link from "next/link";
import { Plus, Briefcase, Calendar, Users, Trash2, MoreVertical } from "lucide-react";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  team: any[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/projects");
      setProjects(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This will also delete all associated tasks.")) {
      return;
    }

    try {
      await axios.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
      setShowMenu(null);
    } catch (error: any) {
      console.error("❌ Error deleting project:", error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "on-hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    };
    return colors[status] || colors.active;
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      urgent: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track all your projects
          </p>
        </div>
        
        {currentUser?.role === 'admin' && (
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "active", "planning", "completed", "on-hold"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 font-medium capitalize transition-colors ${
              filter === status
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-md dark:bg-gray-800">
          <Briefcase className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No projects found
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {currentUser?.role === 'admin' 
              ? "Get started by creating your first project" 
              : "No projects have been assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div key={project._id} className="relative group">
              <div className="h-full rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg dark:bg-gray-800 border border-transparent hover:border-blue-500">
                
                {/* Three-dot Menu - Admin Only */}
                {currentUser?.role === 'admin' && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === project._id ? null : project._id);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu === project._id && (
                      <>
                        {/* Backdrop to close menu */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowMenu(null)}
                        />
                        
                        {/* Menu */}
                        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                          <Link
                            href={`/projects/${project._id}/edit`}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                            onClick={() => setShowMenu(null)}
                          >
                            <span>Edit Project</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Project Content */}
                <Link href={`/projects/${project._id}`} className="block">
                  <div className="mb-4 flex items-start justify-between pr-8">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {project.name}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="mb-4 line-clamp-2 text-gray-600 dark:text-gray-400">
                    {project.description || "No description provided"}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "No start date"}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      {project.team?.length || 0} team members
                    </div>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                        project.priority
                      )}`}
                    >
                      {project.priority} priority
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
