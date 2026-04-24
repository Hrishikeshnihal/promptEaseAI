import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface SavedProject {
  id?: string;
  userId: string;
  title: string;
  prompt: string;
  code: string;
  plan?: any;
  options?: any;
  createdAt?: any;
}

export async function saveProject(project: Omit<SavedProject, "id" | "createdAt">) {
  if (!project.userId) {
    throw new Error("User not logged in");
  }

  if (!project.code) {
    throw new Error("No generated code to save");
  }

  const docRef = await addDoc(collection(db, "projects"), {
    ...project,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getUserProjects(userId: string): Promise<SavedProject[]> {
  if (!userId) return [];

  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedProject, "id">),
  }));
}
