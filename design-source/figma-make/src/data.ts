/* ─────────────────────────────────────────────
   DayDan Prototype Data — Mitchell Household
   One coherent story used across all screens
───────────────────────────────────────────── */

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "done" | "overdue" | "upcoming";
  priority: "high" | "medium" | "low";
  assigneeId?: string;
  dueDate?: string;
  dueTime?: string;
  category?: string;
  categoryColor?: string;
  projectId?: string;
  routineId?: string;
  points?: number;
  isRecurring?: boolean;
  recurrence?: string;
  tags?: string[];
  subtasks?: SubTask[];
  completedAt?: string;
  notes?: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: "admin" | "adult" | "child";
  avatarColor: string;
  email: string;
  points: number;
  streak: number;
  tasksCompleted: number;
  tasksAssigned: number;
  isCurrentUser?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  taskIds: string[];
  owner: string;
  dueDate?: string;
  status: "active" | "paused" | "done";
}

export interface Routine {
  id: string;
  name: string;
  schedule: string;
  time?: string;
  taskTitles: string[];
  streak: number;
  assigneeId?: string;
  lastCompleted?: string;
  icon: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  isShared: boolean;
  ownerId: string;
  items: ShoppingItem[];
  emoji: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  done: boolean;
  addedById?: string;
  quantity?: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  isFamily: boolean;
  progress: number;
  target: number;
  unit: string;
  reward?: string;
  contributorIds?: string[];
  emoji: string;
  color: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  icon: string;
  forMemberId?: string;
}

export interface ActivityItem {
  id: string;
  type: "completed" | "assigned" | "reward" | "points" | "goal" | "streak";
  actorId: string;
  text: string;
  timestamp: string;
  icon: string;
  points?: number;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  description?: string;
  lastDone?: string;
  nextDue: string;
  intervalDays: number;
  category: string;
  assigneeId?: string;
  status: "ok" | "due-soon" | "overdue";
  icon: string;
}

/* ─── Members ─────────────────────────── */
export const MEMBERS: Member[] = [
  {
    id: "sarah",
    name: "Sarah",
    initials: "SM",
    role: "admin",
    avatarColor: "var(--member-sarah)",
    email: "sarah@mitchells.home",
    points: 1240,
    streak: 9,
    tasksCompleted: 67,
    tasksAssigned: 14,
    isCurrentUser: true,
  },
  {
    id: "daniel",
    name: "Daniel",
    initials: "DM",
    role: "adult",
    avatarColor: "var(--member-daniel)",
    email: "daniel@mitchells.home",
    points: 980,
    streak: 6,
    tasksCompleted: 54,
    tasksAssigned: 11,
  },
  {
    id: "liam",
    name: "Liam",
    initials: "LM",
    role: "child",
    avatarColor: "var(--member-liam)",
    email: "liam@mitchells.home",
    points: 340,
    streak: 12,
    tasksCompleted: 38,
    tasksAssigned: 8,
  },
];

export const CHILD_MEMBER: Member = MEMBERS.find(m => m.role === "child")!;
export const PARENT_MEMBER: Member = MEMBERS.find(m => m.isCurrentUser)!;

/* ─── Tasks ───────────────────────────── */
export const TASKS: Task[] = [
  /* ─ TODAY / OVERDUE ─ */
  {
    id: "t1",
    title: "School run — drop off Liam",
    status: "done",
    priority: "high",
    assigneeId: "sarah",
    dueDate: "2026-08-15",
    dueTime: "08:15",
    category: "Family",
    categoryColor: "var(--brand)",
    points: 10,
    isRecurring: true,
    recurrence: "Weekdays",
    completedAt: "2026-08-15T08:17:00",
  },
  {
    id: "t2",
    title: "Pay electricity bill",
    status: "overdue",
    priority: "high",
    assigneeId: "sarah",
    dueDate: "2026-08-13",
    category: "Finance",
    categoryColor: "var(--sig-due)",
    points: 15,
    notes: "Online banking — reference #2214",
  },
  {
    id: "t3",
    title: "Feed Biscuit (dog)",
    status: "done",
    priority: "medium",
    assigneeId: "liam",
    dueDate: "2026-08-15",
    dueTime: "07:30",
    category: "Pet Care",
    categoryColor: "var(--accent)",
    points: 15,
    isRecurring: true,
    recurrence: "Daily",
    routineId: "routine-morning",
    completedAt: "2026-08-15T07:34:00",
  },
  {
    id: "t4",
    title: "Do homework — maths chapter 4",
    status: "todo",
    priority: "high",
    assigneeId: "liam",
    dueDate: "2026-08-15",
    dueTime: "17:00",
    category: "School",
    categoryColor: "var(--sig-flag)",
    points: 25,
    subtasks: [
      { id: "st1", title: "Read chapter 4", done: true },
      { id: "st2", title: "Complete exercises 1–10", done: false },
      { id: "st3", title: "Check answers", done: false },
    ],
  },
  {
    id: "t5",
    title: "Vacuum living room & hallway",
    status: "todo",
    priority: "medium",
    assigneeId: "sarah",
    dueDate: "2026-08-15",
    category: "Cleaning",
    categoryColor: "var(--sig-done)",
    points: 20,
    isRecurring: true,
    recurrence: "Weekly — Friday",
  },
  {
    id: "t6",
    title: "Take out recycling bins",
    status: "todo",
    priority: "medium",
    assigneeId: "daniel",
    dueDate: "2026-08-15",
    dueTime: "18:00",
    category: "Household",
    categoryColor: "var(--sig-done)",
    points: 10,
    isRecurring: true,
    recurrence: "Tue & Fri",
  },
  {
    id: "t7",
    title: "Water the indoor plants",
    status: "done",
    priority: "low",
    assigneeId: "sarah",
    dueDate: "2026-08-15",
    category: "Home",
    categoryColor: "var(--sig-done)",
    points: 10,
    isRecurring: true,
    recurrence: "Mon & Thu",
    completedAt: "2026-08-15T09:10:00",
  },
  {
    id: "t8",
    title: "Tidy bedroom",
    status: "todo",
    priority: "medium",
    assigneeId: "liam",
    dueDate: "2026-08-15",
    category: "Cleaning",
    categoryColor: "var(--sig-done)",
    points: 20,
    isRecurring: true,
    recurrence: "Daily",
    routineId: "routine-evening",
  },
  /* ─ UPCOMING ─ */
  {
    id: "t9",
    title: "Change HVAC air filter",
    status: "upcoming",
    priority: "high",
    assigneeId: "daniel",
    dueDate: "2026-08-20",
    category: "Maintenance",
    categoryColor: "var(--sig-due)",
    points: 30,
    isRecurring: true,
    recurrence: "Monthly",
    notes: "Filter size: 20×25×1 — buy at hardware store",
  },
  {
    id: "t10",
    title: "Grocery run",
    status: "upcoming",
    priority: "medium",
    assigneeId: "sarah",
    dueDate: "2026-08-16",
    category: "Shopping",
    categoryColor: "var(--brand)",
    points: 20,
    isRecurring: true,
    recurrence: "Weekly",
  },
  {
    id: "t11",
    title: "Book dentist appointments",
    status: "upcoming",
    priority: "medium",
    assigneeId: "sarah",
    dueDate: "2026-08-18",
    category: "Health",
    categoryColor: "var(--accent)",
    points: 15,
  },
  {
    id: "t12",
    title: "Clean bathrooms",
    status: "upcoming",
    priority: "medium",
    assigneeId: "daniel",
    dueDate: "2026-08-17",
    category: "Cleaning",
    categoryColor: "var(--sig-done)",
    points: 25,
    isRecurring: true,
    recurrence: "Weekly",
  },
  {
    id: "t13",
    title: "Science project research",
    status: "todo",
    priority: "high",
    assigneeId: "liam",
    dueDate: "2026-08-22",
    category: "School",
    categoryColor: "var(--sig-flag)",
    points: 50,
    projectId: "proj-science",
    subtasks: [
      { id: "st4", title: "Choose topic", done: true },
      { id: "st5", title: "Find 3 sources", done: false },
      { id: "st6", title: "Write outline", done: false },
      { id: "st7", title: "Create poster", done: false },
    ],
  },
  {
    id: "t14",
    title: "Kitchen renovation — get quotes",
    status: "upcoming",
    priority: "medium",
    assigneeId: "sarah",
    dueDate: "2026-08-25",
    category: "Home",
    categoryColor: "var(--sig-due)",
    points: 30,
    projectId: "proj-kitchen",
  },
  {
    id: "t15",
    title: "Kitchen renovation — measure cabinets",
    status: "done",
    priority: "medium",
    assigneeId: "daniel",
    dueDate: "2026-08-10",
    category: "Home",
    categoryColor: "var(--sig-due)",
    points: 25,
    projectId: "proj-kitchen",
    completedAt: "2026-08-10T14:30:00",
  },
  /* ─ COMPLETED (history) ─ */
  {
    id: "t16",
    title: "Meal prep for the week",
    status: "done",
    priority: "medium",
    assigneeId: "sarah",
    dueDate: "2026-08-11",
    category: "Household",
    categoryColor: "var(--sig-done)",
    points: 30,
    completedAt: "2026-08-11T11:00:00",
  },
  {
    id: "t17",
    title: "Wash and dry laundry",
    status: "done",
    priority: "low",
    assigneeId: "daniel",
    dueDate: "2026-08-14",
    category: "Household",
    categoryColor: "var(--sig-done)",
    points: 15,
    completedAt: "2026-08-14T15:00:00",
  },
];

/* ─── Projects ────────────────────────── */
export const PROJECTS: Project[] = [
  {
    id: "proj-science",
    name: "Science Fair Project",
    description: "Solar system model for Year 5 science fair",
    color: "var(--project-1)",
    progress: 25,
    taskIds: ["t13"],
    owner: "liam",
    dueDate: "2026-08-29",
    status: "active",
  },
  {
    id: "proj-kitchen",
    name: "Kitchen Renovation",
    description: "Planning and quotes for kitchen remodel",
    color: "var(--project-2)",
    progress: 40,
    taskIds: ["t14", "t15"],
    owner: "sarah",
    dueDate: "2026-09-30",
    status: "active",
  },
  {
    id: "proj-garden",
    name: "Garden Revamp",
    description: "Redesign the back garden layout",
    color: "var(--project-3)",
    progress: 10,
    taskIds: [],
    owner: "daniel",
    status: "paused",
  },
];

/* ─── Routines ────────────────────────── */
export const ROUTINES: Routine[] = [
  {
    id: "routine-morning",
    name: "Morning Routine",
    schedule: "Daily",
    time: "07:00",
    taskTitles: ["Wake up & stretch", "Brush teeth", "Get dressed", "Eat breakfast", "Feed Biscuit", "Pack school bag"],
    streak: 12,
    assigneeId: "liam",
    lastCompleted: "2026-08-15",
    icon: "🌅",
  },
  {
    id: "routine-evening",
    name: "Evening Wind-down",
    schedule: "Daily",
    time: "20:00",
    taskTitles: ["Finish homework", "Tidy bedroom", "Shower / bath", "Read for 20 mins", "Lights out by 21:00"],
    streak: 7,
    assigneeId: "liam",
    lastCompleted: "2026-08-14",
    icon: "🌙",
  },
  {
    id: "routine-weekly-clean",
    name: "Weekly House Clean",
    schedule: "Friday",
    time: "10:00",
    taskTitles: ["Vacuum all rooms", "Mop kitchen", "Clean bathrooms", "Take out bins", "Wipe surfaces"],
    streak: 4,
    assigneeId: "sarah",
    lastCompleted: "2026-08-08",
    icon: "🏠",
  },
  {
    id: "routine-school-drop",
    name: "School Morning",
    schedule: "Weekdays",
    time: "08:00",
    taskTitles: ["School run drop-off", "Check Liam packed lunch", "Message teacher if absent"],
    streak: 9,
    assigneeId: "sarah",
    lastCompleted: "2026-08-15",
    icon: "🎒",
  },
];

/* ─── Shopping lists ──────────────────── */
export const SHOPPING_LISTS: ShoppingList[] = [
  {
    id: "sl-groceries",
    name: "Groceries",
    isShared: true,
    ownerId: "sarah",
    emoji: "🛒",
    items: [
      { id: "si1", text: "Whole milk (2L)", done: false, addedById: "sarah", quantity: "1" },
      { id: "si2", text: "Wholemeal bread", done: false, addedById: "sarah", quantity: "2 loaves" },
      { id: "si3", text: "Free-range eggs", done: true, addedById: "daniel", quantity: "12" },
      { id: "si4", text: "Chicken breasts", done: false, addedById: "sarah", quantity: "1 kg" },
      { id: "si5", text: "Broccoli", done: false, addedById: "daniel" },
      { id: "si6", text: "Cheddar cheese", done: false, addedById: "sarah", quantity: "400g" },
      { id: "si7", text: "Greek yoghurt", done: true, addedById: "sarah", quantity: "500g" },
      { id: "si8", text: "Pasta (penne)", done: false, addedById: "sarah", quantity: "2 packs" },
      { id: "si9", text: "Tomato sauce", done: false, addedById: "daniel", quantity: "2 jars" },
      { id: "si10", text: "Biscuit dog food", done: false, addedById: "liam", quantity: "1 bag" },
    ],
  },
  {
    id: "sl-school",
    name: "School Supplies",
    isShared: false,
    ownerId: "sarah",
    emoji: "✏️",
    items: [
      { id: "ss1", text: "Coloured pencils", done: false },
      { id: "ss2", text: "A4 notebook (lined)", done: true },
      { id: "ss3", text: "Glue stick", done: false },
      { id: "ss4", text: "Poster board (white)", done: false, quantity: "2" },
    ],
  },
  {
    id: "sl-hardware",
    name: "Hardware Store",
    isShared: true,
    ownerId: "daniel",
    emoji: "🔧",
    items: [
      { id: "hw1", text: "HVAC filter 20×25×1", done: false, addedById: "daniel" },
      { id: "hw2", text: "LED bulbs (E27)", done: false, addedById: "sarah", quantity: "4" },
    ],
  },
];

/* ─── Goals ───────────────────────────── */
export const GOALS: Goal[] = [
  {
    id: "goal-chores",
    name: "100 Household Chores",
    description: "Complete 100 household tasks together this month",
    isFamily: true,
    progress: 67,
    target: 100,
    unit: "chores",
    reward: "Family movie night with snacks",
    contributorIds: ["sarah", "daniel", "liam"],
    emoji: "🏆",
    color: "var(--goal-1)",
  },
  {
    id: "goal-streak",
    name: "Liam — 20-Day School Streak",
    description: "Complete the morning routine every school day",
    isFamily: false,
    progress: 12,
    target: 20,
    unit: "days",
    reward: "New video game",
    contributorIds: ["liam"],
    emoji: "🔥",
    color: "var(--goal-2)",
  },
  {
    id: "goal-sarah-inbox",
    name: "Clear Daily Inbox",
    description: "Stay on top of email and tasks every working day",
    isFamily: false,
    progress: 9,
    target: 14,
    unit: "days",
    reward: "Spa afternoon",
    contributorIds: ["sarah"],
    emoji: "📬",
    color: "var(--goal-3)",
  },
];

/* ─── Rewards ─────────────────────────── */
export const REWARDS: Reward[] = [
  { id: "r1", name: "Movie Night", description: "Family movie night with popcorn", pointsCost: 500, icon: "🎬", forMemberId: "liam" },
  { id: "r2", name: "Extra Screen Time", description: "30 extra minutes of gaming", pointsCost: 100, icon: "🎮", forMemberId: "liam" },
  { id: "r3", name: "New Video Game", description: "One game from the wishlist", pointsCost: 1000, icon: "🕹️", forMemberId: "liam" },
  { id: "r4", name: "Stay Up Late", description: "30 mins extra on Friday", pointsCost: 150, icon: "🌙", forMemberId: "liam" },
  { id: "r5", name: "Takeaway Night", description: "Choose any restaurant for delivery", pointsCost: 300, icon: "🍕", forMemberId: "liam" },
];

/* ─── Activity feed ───────────────────── */
export const ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "completed", actorId: "liam", text: "Liam completed Feed Biscuit", timestamp: "2026-08-15T07:34:00", icon: "✓", points: 15 },
  { id: "a2", type: "streak", actorId: "liam", text: "Liam is on a 12-day morning streak!", timestamp: "2026-08-15T07:35:00", icon: "🔥" },
  { id: "a3", type: "completed", actorId: "sarah", text: "Sarah completed Water the plants", timestamp: "2026-08-15T09:10:00", icon: "✓", points: 10 },
  { id: "a4", type: "completed", actorId: "sarah", text: "Sarah completed School run", timestamp: "2026-08-15T08:17:00", icon: "✓", points: 10 },
  { id: "a5", type: "goal", actorId: "liam", text: "Household chores goal reached 67/100", timestamp: "2026-08-14T18:00:00", icon: "🎯" },
  { id: "a6", type: "completed", actorId: "daniel", text: "Daniel completed Wash laundry", timestamp: "2026-08-14T15:00:00", icon: "✓", points: 15 },
  { id: "a7", type: "points", actorId: "liam", text: "Liam earned 50 points — reached 340 total", timestamp: "2026-08-14T17:00:00", icon: "⭐", points: 50 },
  { id: "a8", type: "assigned", actorId: "sarah", text: "Sarah assigned HVAC filter change to Daniel", timestamp: "2026-08-13T10:00:00", icon: "📋" },
  { id: "a9", type: "completed", actorId: "sarah", text: "Sarah completed Meal prep", timestamp: "2026-08-11T11:00:00", icon: "✓", points: 30 },
  { id: "a10", type: "reward", actorId: "liam", text: "Liam redeemed Extra Screen Time", timestamp: "2026-08-10T19:00:00", icon: "🎮" },
];

/* ─── Maintenance items ───────────────── */
export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "m1",
    name: "HVAC Air Filter",
    description: "Replace 20×25×1 filter",
    lastDone: "2026-07-20",
    nextDue: "2026-08-20",
    intervalDays: 30,
    category: "HVAC",
    assigneeId: "daniel",
    status: "due-soon",
    icon: "🌡️",
  },
  {
    id: "m2",
    name: "Smoke Detector Batteries",
    description: "Test and replace if needed",
    lastDone: "2026-06-01",
    nextDue: "2026-12-01",
    intervalDays: 180,
    category: "Safety",
    status: "ok",
    icon: "🔋",
  },
  {
    id: "m3",
    name: "Gutter Clean",
    description: "Clear leaves and debris",
    lastDone: "2026-04-15",
    nextDue: "2026-10-15",
    intervalDays: 183,
    category: "Exterior",
    assigneeId: "daniel",
    status: "ok",
    icon: "🏠",
  },
  {
    id: "m4",
    name: "Boiler Service",
    description: "Annual boiler service — book engineer",
    lastDone: "2025-09-01",
    nextDue: "2026-09-01",
    intervalDays: 365,
    category: "Heating",
    status: "ok",
    icon: "🔥",
  },
  {
    id: "m5",
    name: "Car Oil Change",
    description: "Service interval — 10,000 km",
    lastDone: "2026-05-10",
    nextDue: "2026-08-12",
    intervalDays: 90,
    category: "Vehicle",
    assigneeId: "daniel",
    status: "overdue",
    icon: "🚗",
  },
];

/* ─── Calendar events ─────────────────── */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  allDay?: boolean;
  color: string;
  assigneeId?: string;
  type: "task" | "routine" | "event";
}

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "ce1", title: "School drop-off", date: "2026-08-15", time: "08:15", color: "var(--member-sarah)", assigneeId: "sarah", type: "task" },
  { id: "ce2", title: "Pay electricity bill", date: "2026-08-13", color: "var(--sig-over)", assigneeId: "sarah", type: "task" },
  { id: "ce3", title: "Grocery run", date: "2026-08-16", color: "var(--member-sarah)", assigneeId: "sarah", type: "task" },
  { id: "ce4", title: "Clean bathrooms", date: "2026-08-17", color: "var(--member-daniel)", assigneeId: "daniel", type: "task" },
  { id: "ce5", title: "Book dentist", date: "2026-08-18", color: "var(--member-liam)", type: "task" },
  { id: "ce6", title: "HVAC filter change", date: "2026-08-20", color: "var(--member-daniel)", assigneeId: "daniel", type: "task" },
  { id: "ce7", title: "Science fair project due", date: "2026-08-29", color: "var(--project-1)", assigneeId: "liam", type: "event" },
  { id: "ce8", title: "Kitchen quotes due", date: "2026-08-25", color: "var(--project-2)", assigneeId: "sarah", type: "task" },
  { id: "ce9", title: "Weekly house clean", date: "2026-08-15", time: "10:00", color: "var(--sig-done)", assigneeId: "sarah", type: "routine" },
  { id: "ce10", title: "Weekly house clean", date: "2026-08-22", time: "10:00", color: "var(--sig-done)", assigneeId: "sarah", type: "routine" },
];

/* ─── Helpers ─────────────────────────── */
export function getMemberById(id: string): Member | undefined {
  return MEMBERS.find(m => m.id === id);
}

export function getTasksByAssignee(assigneeId: string): Task[] {
  return TASKS.filter(t => t.assigneeId === assigneeId);
}

export function getTodayTasks(): Task[] {
  const today = "2026-08-15";
  return TASKS.filter(t => t.dueDate === today || t.status === "overdue" || t.status === "done" && t.completedAt?.startsWith(today));
}

export function getOverdueTasks(): Task[] {
  return TASKS.filter(t => t.status === "overdue");
}

export function getUpcomingTasks(): Task[] {
  return TASKS.filter(t => t.status === "upcoming");
}

export function getChildTasks(): Task[] {
  return TASKS.filter(t => t.assigneeId === "liam");
}

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date("2026-08-15T12:00:00");
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date("2026-08-15");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
