import React, { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { getUserProjects, type SavedProject } from "../lib/project-service";

export default function MyProjects() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const user = auth.currentUser;

        if (!user) {
          setProjects([]);
          return;
        }

        const data = await getUserProjects(user.uid);
        setProjects(data);
      } catch (error) {
        console.error("Load projects error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-500">
        Loading projects...
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">My Projects</h1>
        <p className="text-slate-500">Please login to view saved projects.</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">My Projects</h1>
        <p className="text-slate-500">No saved projects yet. Generate and save your first UI.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Projects</h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              {project.title || "Untitled Project"}
            </h2>

            <p className="text-sm text-slate-500 line-clamp-3 mb-4">
              {project.prompt}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{project.options?.theme || "Theme"}</span>
              <span>{project.options?.layout || "Layout"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
