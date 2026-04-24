import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ProjectOptions {
  appType: string;
  theme: string;
  layout: string;
  targetUser: string;
}

export interface ProjectPlan {
  appName: string;
  targetUser: string;
  theme: string;
  layout: string;
  sections: string[];
  components: string[];
  dummyDataNeeded: string[];
  visualStyle: string;
  colorDirection: string;
  suggestedEdits: string[];
}

export interface SavedProject {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  options: ProjectOptions;
  plan: ProjectPlan;
  code: string;
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch
}

const COLLECTION = "projects";

function tsToMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function rowToProject(id: string, data: DocumentData): SavedProject {
  return {
    id,
    userId: data.userId,
    name: data.name,
    prompt: data.prompt,
    options: data.options,
    plan: data.plan,
    code: data.code,
    createdAt: tsToMillis(data.createdAt),
    updatedAt: tsToMillis(data.updatedAt),
  };
}

export async function listProjects(userId: string): Promise<SavedProject[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => rowToProject(d.id, d.data()));
}

export async function getProject(id: string, userId: string): Promise<SavedProject | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.userId !== userId) return null;
  return rowToProject(snap.id, data);
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  prompt: string;
  options: ProjectOptions;
  plan: ProjectPlan;
  code: string;
}

export async function createProject(input: CreateProjectInput): Promise<SavedProject> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  // Re-fetch to get resolved server timestamps.
  const snap = await getDoc(ref);
  const data = snap.data() ?? {};
  return rowToProject(ref.id, { ...input, ...data });
}

export async function deleteProject(id: string, userId: string): Promise<void> {
  const existing = await getProject(id, userId);
  if (!existing) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
