"use client";

import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  color: string;
}) => (
  <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
  });
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);
  const [tasksByPriority, setTasksByPriority] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("Fetching dashboard data...");
        
        // Fetch all data with proper error handling
        const [usersRes, tasksRes, projectsRes] = await Promise.all([
          axios.get("/users").catch(e => ({ data: [] })),
          axios.get("/tasks").catch(e => ({ data: [] })),
          axios.get("/projects").catch(e => ({ data: [] })),
        ]);

        console.log("Users:", usersRes.data);
        console.log("Tasks:", tasksRes.data);
        console.log("Projects:", projectsRes.data);

        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];

        // Calculate stats from actual data
        const calculatedStats = {
          totalUsers: users.length,
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => 
            t.status?.toLowerCase() === "completed" || t.status?.toLowerCase() === "done"
          ).length,
          inProgressTasks: tasks.filter((t: any) => 
            t.status?.toLowerCase() === "in progress" || t.status?.toLowerCase() === "in-progress"
          ).length,
          todoTasks: tasks.filter((t: any) => 
            t.status?.toLowerCase() === "to do" || t.status?.toLowerCase() === "todo"
          ).length,
        };

        console.log("Calculated stats:", calculatedStats);
        setStats(calculatedStats);

        // Tasks by status
        const statusCount = tasks.reduce((acc: any, task: any) => {
          const status = task.status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const statusData = Object.entries(statusCount).map(([status, count]) => ({
          status,
          count: count as number,
        }));
        console.log("Tasks by status:", statusData);
        setTasksByStatus(statusData);

        // Tasks by priority
        const priorityCount = tasks.reduce((acc: any, task: any) => {
          const priority = task.priority || "None";
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {});

        const priorityData = Object.entries(priorityCount).map(([priority, count]) => ({
          priority,
          count: count as number,
        }));
        console.log("Tasks by priority:", priorityData);
        setTasksByPriority(priorityData);

        // Recent projects
        const sortedProjects = projects
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);
        
        console.log("Recent projects:", sortedProjects);
        setRecentProjects(sortedProjects);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message || "Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-xl text-gray-600 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <div className="text-xl text-gray-900 dark:text-white mb-2">Error Loading Dashboard</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900 transition-colors">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Admin Project Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          color="bg-blue-500"
        />
        <StatCard
          icon={Briefcase}
          title="Total Projects"
          value={stats.totalProjects}
          color="bg-green-500"
        />
        <StatCard
          icon={Activity}
          title="Total Tasks"
          value={stats.totalTasks}
          color="bg-purple-500"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Tasks"
          value={stats.completedTasks}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Tasks by Status */}
        {tasksByStatus.length > 0 ? (
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Tasks by Status
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="status" className="text-gray-600 dark:text-gray-300" />
                <YAxis className="text-gray-600 dark:text-gray-300" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 flex items-center justify-center h-[350px]">
            <p className="text-gray-500 dark:text-gray-400">No task status data available</p>
          </div>
        )}

        {/* Tasks by Priority */}
        {tasksByPriority.length > 0 ? (
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Tasks by Priority
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, percent }) =>
                    `${priority}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {tasksByPriority.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 flex items-center justify-center h-[350px]">
            <p className="text-gray-500 dark:text-gray-400">No task priority data available</p>
          </div>
        )}
      </div>

      {/* Task Progress Overview */}
      <div className="rounded-lg bg-white shadow-md dark:bg-gray-800 p-6 mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Task Progress Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                To Do
              </span>
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
              {stats.todoTasks}
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                In Progress
              </span>
              <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <p className="mt-2 text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {stats.inProgressTasks}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-300">
                Completed
              </span>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-900 dark:text-green-300">
              {stats.completedTasks}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Projects
        </h2>
        {recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Project Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project, i) => (
                  <tr
                    key={project._id || project.id || i}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                      {project.name || "Unnamed Project"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${
                          project.status?.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : project.status?.toLowerCase() === "on hold"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {project.status || "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(
                        project.updatedAt || project.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent projects found
          </div>
        )}
      </div>
    </div>
  );
}
