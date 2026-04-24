import React, { useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Workspace from "@/components/Workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getProject, type SavedProject } from "@/lib/firestore-projects";

export default function ProjectDetailPage() {
  const [, params] = useRoute("/projects/:id");
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const projectId = params?.id;
  const uid = user?.uid;

  const { data: project, isLoading: projectLoading, isError } = useQuery<SavedProject | null>({
    queryKey: ["project", projectId, uid],
    queryFn: () => (projectId && uid ? getProject(projectId, uid) : Promise.resolve(null)),
    enabled: !!projectId && !!uid,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || (isAuthenticated && projectLoading)) {
    return (
      <div className="flex-1 flex h-full p-6 gap-6">
        <Skeleton className="w-[400px] h-full rounded-xl" />
        <Skeleton className="flex-1 h-full rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isError || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Project not found</h2>
        <p className="text-muted-foreground">The project you are looking for does not exist or you don't have access to it.</p>
        <Link href="/projects"><Button>Back to Projects</Button></Link>
      </div>
    );
  }

  return <Workspace initialProject={project} />;
}
