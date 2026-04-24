import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { listProjects, deleteProject, type SavedProject } from "@/lib/firestore-projects";

const projectsQueryKey = (uid: string) => ["projects", uid];

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uid = user?.uid;

  const { data: projects, isLoading: projectsLoading } = useQuery<SavedProject[]>({
    queryKey: uid ? projectsQueryKey(uid) : ["projects", "anon"],
    queryFn: () => (uid ? listProjects(uid) : Promise.resolve([])),
    enabled: !!uid,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!uid) throw new Error("Not signed in");
      return deleteProject(id, uid);
    },
    onSuccess: () => {
      if (uid) queryClient.invalidateQueries({ queryKey: projectsQueryKey(uid) });
      toast({ title: "Deleted", description: "Project has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not delete project.", variant: "destructive" });
    },
  });

  if (authLoading) {
    return <div className="p-8 flex justify-center"><Skeleton className="h-12 w-64" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-2xl font-bold">Sign in to view projects</h2>
        <p className="text-muted-foreground max-w-sm">You need an account to save and view your creative projects.</p>
        <Link href="/login"><Button size="lg">Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <Link href="/">
          <Button className="hover-elevate">Create New Project</Button>
        </Link>
      </div>

      {projectsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 rounded-2xl border-2 border-dashed">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mb-8">Your creative workshop is empty. Start building your first AI-generated UI today.</p>
          <Link href="/">
            <Button size="lg" className="hover-elevate">Start Building</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col overflow-hidden hover-elevate transition-all duration-300 border-border/50 group">
              <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                <span className="text-4xl font-bold opacity-20 group-hover:opacity-30 transition-opacity">
                  {project.name.substring(0, 2).toUpperCase()}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <CardHeader className="relative pt-4">
                <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1 h-10">{project.prompt}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground">
                    {project.options.theme}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-accent/20 text-accent-foreground">
                    {project.options.layout}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                <Link href={`/projects/${project.id}`} className="flex-1 mr-2">
                  <Button variant="default" size="sm" className="w-full">Open</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => deleteMutation.mutate(project.id)}
                  disabled={deleteMutation.isPending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
