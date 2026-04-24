import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditUi } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PreviewIframe } from "@/components/PreviewIframe";
import { auth } from "../lib/firebase";
import { saveProject } from "../lib/project-service";

const THEME_OPTIONS = ["Light", "Dark", "Colorful", "Minimal"];
const LAYOUT_OPTIONS = ["Landing Page", "Dashboard", "Mobile App", "Cards"];
const TARGET_USER_OPTIONS = ["Student", "Business", "Creator", "Customer"];

interface WorkspaceProps {
  initialProject?: any;
}

export default function Workspace({ initialProject }: WorkspaceProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState(initialProject?.prompt || "");
  const [appType, setAppType] = useState(initialProject?.options?.appType || "");
  const [theme, setTheme] = useState(initialProject?.options?.theme || "Colorful");
  const [layout, setLayout] = useState(initialProject?.options?.layout || "Landing Page");
  const [targetUser, setTargetUser] = useState(initialProject?.options?.targetUser || "Creator");

  const [code, setCode] = useState(initialProject?.code || "");
  const [plan, setPlan] = useState<any>(initialProject?.plan || null);
  const [editInstruction, setEditInstruction] = useState("");

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState("App.tsx");

  const buildUiMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await fetch("http://localhost:5000/api/build-ui", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: promptText })
      });
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      return res.json();
    }
  });

  const editUiMutation = useEditUi();

  const handleSaveProject = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login before saving project");
        return;
      }

      if (!code) {
        alert("Generate UI first before saving");
        return;
      }

      const title =
        plan?.appName ||
        prompt?.slice(0, 40) ||
        "Untitled Project";

      await saveProject({
        userId: user.uid,
        title,
        prompt,
        code: code,
        plan: plan || null,
        options: { appType, theme, layout, targetUser } || null,
      });

      alert("Project saved successfully!");
    } catch (error: any) {
      console.error("Save project error:", error);
      alert(error.message || "Failed to save project");
    }
  };

  useEffect(() => {
    if (prompt && !appType && prompt.length > 5 && !initialProject) {
      const words = prompt.split(" ").slice(0, 3).join(" ");
      setAppType(words);
    }
  }, [prompt, appType, initialProject]);

  const handleGenerate = async () => {
    if (!prompt) {
      toast({ title: "Oops!", description: "Please enter a prompt first.", variant: "destructive" });
      return;
    }

    try {
      const res = await buildUiMutation.mutateAsync(prompt);
      setCode(res.code || `// ${res.message || "API working"}`);
      if (res.plan) {
        setPlan(res.plan);
      }
      setActiveTab("preview");
      toast({ title: "Success!", description: res.message || "Your UI has been generated." });
    } catch (err) {
      console.error("API call failed:", err);
      const message = (err as Error)?.message || "Something went wrong.";
      toast({ title: "Generation failed", description: message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!editInstruction || !code) return;

    try {
      const res = await editUiMutation.mutateAsync({
        data: {
          code,
          instruction: editInstruction,
        },
      });
      setCode(res.code);
      setEditInstruction("");
      toast({ title: "Updated!", description: "Your edit has been applied." });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || (err as Error)?.message
        || "Something went wrong.";
      toast({ title: "Edit failed", description: message, variant: "destructive" });
    }
  };



  const isPending = buildUiMutation.isPending || editUiMutation.isPending;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full max-w-[1600px] mx-auto overflow-hidden">
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 border-r bg-background/50 flex flex-col overflow-y-auto">
        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">Create an App</h2>
            <p className="text-muted-foreground text-sm">Describe what you want to build and pick a vibe. We'll handle the React code.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-semibold">What's your idea?</Label>
              <Textarea
                id="prompt"
                placeholder="e.g. A colorful habit tracker for morning runners with a dashboard..."
                className="min-h-[120px] resize-none text-base p-4 bg-white/50 focus:bg-white transition-colors"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="bg-white/50"><SelectValue placeholder="Select theme" /></SelectTrigger>
                  <SelectContent>
                    {THEME_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Layout</Label>
                <Select value={layout} onValueChange={setLayout}>
                  <SelectTrigger className="bg-white/50"><SelectValue placeholder="Select layout" /></SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Target User</Label>
                <Select value={targetUser} onValueChange={setTargetUser}>
                  <SelectTrigger className="bg-white/50"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {TARGET_USER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">App Name</Label>
                <Input
                  value={appType}
                  onChange={e => setAppType(e.target.value)}
                  placeholder="e.g. Habit Tracker"
                  className="bg-white/50"
                />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold shadow-md hover-elevate rounded-xl mt-4"
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {buildUiMutation.isPending ? "Generating UI..." : "Updating UI..."}
                </div>
              ) : "Generate UI"}
            </Button>
          </div>

          {code && (
            <div className="pt-6 border-t space-y-4 animate-in fade-in duration-500">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tweak the design</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Make the buttons rounder"
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEdit()}
                  />
                  <Button variant="secondary" onClick={handleEdit} disabled={isPending || !editInstruction}>
                    Update
                  </Button>
                </div>
              </div>

              {!initialProject && (
                isAuthenticated ? (
                  <Button variant="outline" className="w-full" onClick={handleSaveProject}>
                    Save to My Projects
                  </Button>
                ) : (
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">Sign in to save</Button>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden bg-muted/20">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "code")} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground/80">
              {plan ? <span>{plan.appName} <span className="text-muted-foreground font-normal text-sm ml-2">({plan.theme} Theme)</span></span> : "Preview"}
            </h3>
            <TabsList className="grid w-[200px] grid-cols-2 bg-background border shadow-sm">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 relative">
            {isPending ? (
              <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold animate-pulse text-foreground">
                  {buildUiMutation.isPending ? "Planning your app..." : "Applying edits..."}
                </h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-center">
                  Gemini plans the structure, Groq writes the code, Ollama tidies it up. This takes about 15-30 seconds.
                </p>
              </div>
            ) : null}

            <TabsContent value="preview" className="h-full m-0 data-[state=active]:flex flex-col">
              <PreviewIframe code={code} />
            </TabsContent>

            <TabsContent value="code" className="h-full m-0 data-[state=active]:flex flex-col">
              <div className="w-full h-full rounded-xl border bg-slate-950 text-slate-50 flex overflow-hidden relative">
                {code ? (
                  <>
                    <div className="w-48 sm:w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
                      <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        Files
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {["App.tsx", "index.css", "tailwind.config.js", "package.json"].map(file => (
                          <button
                            key={file}
                            onClick={() => setActiveFile(file)}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors \${activeFile === file ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"}`}
                          >
                            <span className="mr-2 opacity-60 text-xs">
                              {file.endsWith('.tsx') ? '⚛️' : file.endsWith('.css') ? '🎨' : '📦'}
                            </span>
                            {file}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center text-sm font-mono text-slate-300">
                        {activeFile}
                      </div>
                      <pre className="p-6 text-sm font-mono overflow-auto flex-1 w-full break-pre whitespace-pre-wrap">
                        <code>
                          {activeFile === "App.tsx" ? code : 
                           activeFile === "index.css" ? "@tailwind base;\\n@tailwind components;\\n@tailwind utilities;" :
                           activeFile === "tailwind.config.js" ? "/** @type {import('tailwindcss').Config} */\\nmodule.exports = {\\n  content: [\\n    \\\"./index.html\\\",\\n    \\\"./src/**/*.{js,ts,jsx,tsx}\\\",\\n  ],\\n  theme: {\\n    extend: {},\\n  },\\n  plugins: [],\\n}" :
                           "{\\n  \\\"name\\\": \\\"generated-app\\\",\\n  \\\"version\\\": \\\"1.0.0\\\",\\n  \\\"dependencies\\\": {\\n    \\\"react\\\": \\\"^18.2.0\\\",\\n    \\\"react-dom\\\": \\\"^18.2.0\\\",\\n    \\\"tailwindcss\\\": \\\"latest\\\"\\n  }\\n}"}
                        </code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                    No code generated yet
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
