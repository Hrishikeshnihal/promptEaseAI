import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const initial =
    user?.displayName?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-bold text-lg hidden sm:inline-block tracking-tight text-foreground">
              PromptEase <span className="text-primary font-medium">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {!isLoading && isAuthenticated && (
              <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
                My Projects
              </Link>
            )}

            {!isLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium overflow-hidden shadow-sm">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:flex text-muted-foreground">
                    Log out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="font-medium shadow-sm hover-elevate">Sign In</Button>
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
