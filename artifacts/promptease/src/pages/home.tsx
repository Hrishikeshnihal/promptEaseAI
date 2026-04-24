import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Workspace from "@/components/Workspace";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="space-y-8 w-full max-w-4xl text-center">
          <Skeleton className="h-16 w-3/4 mx-auto rounded-xl" />
          <Skeleton className="h-8 w-1/2 mx-auto rounded-lg" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Workspace />;
  }

  // Landing Page for unauthenticated users
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-4">
          The magical UI builder
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          Turn your ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">beautiful UIs</span> instantly.
        </h1>
        <p className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Describe what you want in plain English. PromptEase acts as your personal frontend developer, building polished React components right before your eyes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg font-medium shadow-lg hover-elevate rounded-xl w-full sm:w-auto">
              Start Creating for Free
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium rounded-xl w-full sm:w-auto bg-background/50 backdrop-blur-sm">
            View Gallery
          </Button>
        </div>

        <div className="mt-20 pt-10 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
            </div>
            <h3 className="font-semibold text-lg">Plain Language</h3>
            <p className="text-muted-foreground text-sm">No coding required. Just tell us what you want like you're talking to a friend.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
            </div>
            <h3 className="font-semibold text-lg">Real React Code</h3>
            <p className="text-muted-foreground text-sm">We generate clean, production-ready React components styled with Tailwind CSS.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </div>
            <h3 className="font-semibold text-lg">Iterate Fast</h3>
            <p className="text-muted-foreground text-sm">Not quite right? Just type a follow-up instruction to tweak the design instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
