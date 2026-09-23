import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { TASKS, Task } from "../data";

/* ─────────────────────────────────────────────
   Household data hooks (production pattern).
   react-query is the single source of truth for the
   mutable task graph; the seed is the Mitchell story.
   In production these query fns hit the API — here they
   resolve the in-memory prototype store.
───────────────────────────────────────────── */

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, refetchOnWindowFocus: false } },
});

const TASKS_KEY = ["household", "tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => TASKS,
    initialData: TASKS,
  });
}

function patch(qc: QueryClient, id: string, fn: (t: Task) => Task) {
  qc.setQueryData<Task[]>(TASKS_KEY, prev => (prev ?? TASKS).map(t => (t.id === id ? fn(t) : t)));
}

export function useTaskMutations() {
  const qc = useQueryClient();

  const complete = useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => patch(qc, id, t => ({ ...t, status: "done", completedAt: new Date().toISOString() })),
  });

  const reopen = useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id => patch(qc, id, t => ({ ...t, status: "todo", completedAt: undefined })),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: id =>
      qc.setQueryData<Task[]>(TASKS_KEY, prev => (prev ?? TASKS).filter(t => t.id !== id)),
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; title: string; details?: Partial<Task> }) => vars,
    onSuccess: ({ id, title, details }) => patch(qc, id, t => ({ ...t, title, ...details })),
  });

  const create = useMutation({
    mutationFn: async (task: Task) => task,
    onSuccess: task => qc.setQueryData<Task[]>(TASKS_KEY, prev => [task, ...(prev ?? TASKS)]),
  });

  return { complete, reopen, remove, update, create };
}
