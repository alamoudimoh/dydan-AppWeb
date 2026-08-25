import { useState, useEffect, useCallback } from "react";
import { MEMBERS, TASKS, Task } from "./data";
import FocusHome from "./screens/FocusHome";
import QuestHome from "./screens/QuestHome";
import TodayScreen from "./screens/TodayScreen";
import AllTasksScreen from "./screens/AllTasksScreen";
import CalendarScreen from "./screens/CalendarScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import RoutinesScreen from "./screens/RoutinesScreen";
import ShoppingScreen from "./screens/ShoppingScreen";
import GoalsScreen from "./screens/GoalsScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SearchScreen from "./screens/SearchScreen";
import ErrorScreen from "./screens/ErrorScreen";
import MaintenanceScreen from "./screens/MaintenanceScreen";
import TaskDetailModal from "./components/TaskDetailModal";
import CreateTaskModal from "./components/CreateTaskModal";

export type Theme = "daydan" | "sovereign";
export type View = "quest" | "focus";
export type Persona = "parent" | "child" | "solo";
export type Screen =
  | "home" | "today" | "all-tasks" | "calendar" | "projects"
  | "routines" | "maintenance" | "shopping" | "goals" | "activity"
  | "settings" | "search" | "error";

export interface AppCtx {
  theme: Theme;
  view: View;
  persona: Persona;
  screen: Screen;
  isRTL: boolean;
  taskDetail: Task | null;
  showCreateTask: boolean;
  navigate: (s: Screen) => void;
  setView: (v: View) => void;
  setTheme: (t: Theme) => void;
  setPersona: (p: Persona) => void;
  toggleRTL: () => void;
  openTask: (t: Task) => void;
  closeTask: () => void;
  openCreate: () => void;
  closeCreate: () => void;
  showToast: (msg: string) => void;
}

/* ─── Icon system ────────────────────── */
const ICON_PATHS: Record<string, string> = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10",
  today: "M8 7V3m8 4V3m-9 8h10|M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  tasks: "M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  calendar: "M8 7V3m8 4V3m-9 8h10|M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  projects: "M2 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
  routines: "M4 6h16|M4 12h16|M4 18h16",
  maintenance: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  shopping: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z|M3 6h18|M16 10a4 4 0 0 1-8 0",
  goals: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  plus: "M12 5v14|M5 12h14",
  check: "M20 6 9 17l-5-5",
  chevron_right: "M9 18l6-6-6-6",
  chevron_down: "M6 9l6 6 6-6",
  x: "M18 6 6 18|M6 6l12 12",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  fire: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3",
  help: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3|M12 17h.01",
  rtl: "M3 9h14|M3 15h14|M7 5l-4 4 4 4|M21 9h-4|M21 15h-4",
  gift: "M20 12v10H4V12|M2 7h20v5H2z|M12 22V7|M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z|M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 0 1-3.46 0",
  error: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z|M12 9v4|M12 17h.01",
  refresh: "M1 4v6h6|M23 20v-6h-6|M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  more: "M5 12h.01|M12 12h.01|M19 12h.01",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M2 12h20|M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6|M10 11v6|M14 11v6|M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z|M7 11V7a5 5 0 0 1 10 0v4",
  info: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z|M12 16v-4|M12 8h.01",
  send: "M22 2 11 13|M22 2 15 22 9 13 2 9l20-7z",
  copy: "M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z|M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  bars: "M3 12h18|M3 6h18|M3 18h18",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  map: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z|M8 2v16|M16 6v16",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z|M7 7h.01",
  repeat: "M17 1l4 4-4 4|M3 11V9a4 4 0 0 1 4-4h14|M7 23l-4-4 4-4|M21 13v2a4 4 0 0 1-4 4H3",
  sparkle: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z|M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z|M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z",
};

export function Icon({ name, size = 18, className = "", style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const paths = (ICON_PATHS[name] || ICON_PATHS["home"]).split("|");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ─── Logo mark ──────────────────────── */
export function LogoMark({ size = 28, theme }: { size?: number; theme: Theme }) {
  if (theme === "sovereign") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="#1A1A1A" stroke="#FFC107" strokeWidth="7" />
        <text x="50" y="66" textAnchor="middle" fill="#FFC107" fontSize="40" fontWeight="800" fontFamily="Ubuntu, sans-serif">M</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#4326EA" />
      <path d="M30 38 L50 26 L70 38 L65 66 L50 74 L35 66z" fill="none" stroke="#09CCF4" strokeWidth="5.5" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="10" fill="#09CCF4" />
    </svg>
  );
}

/* ─── Nav definition ─────────────────── */
type NavDef = { id: Screen; label: string; icon: string; childHidden?: boolean; badge?: string };

const NAV_PRIMARY: NavDef[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "today", label: "Today", icon: "today", badge: "2" },
  { id: "all-tasks", label: "All Tasks", icon: "tasks" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
];

const NAV_ORGANIZE: NavDef[] = [
  { id: "projects", label: "Projects", icon: "projects", childHidden: true },
  { id: "routines", label: "Routines", icon: "routines" },
  { id: "maintenance", label: "Maintenance", icon: "maintenance", childHidden: true },
];

const NAV_HOUSEHOLD: NavDef[] = [
  { id: "shopping", label: "Shopping", icon: "shopping" },
  { id: "goals", label: "Goals", icon: "goals" },
  { id: "activity", label: "Activity", icon: "activity" },
];

/* ─── Sidebar ────────────────────────── */
function Sidebar({ screen, view, theme, persona, isRTL, onNavigate, onViewChange, onThemeChange, onPersonaChange, onToggleRTL, onOpenCreate }: {
  screen: Screen; view: View; theme: Theme; persona: Persona; isRTL: boolean;
  onNavigate: (s: Screen) => void; onViewChange: (v: View) => void;
  onThemeChange: (t: Theme) => void; onPersonaChange: (p: Persona) => void;
  onToggleRTL: () => void; onOpenCreate: () => void;
}) {
  const isChild = persona === "child";
  const currentMember = isChild ? MEMBERS.find(m => m.role === "child")! : MEMBERS.find(m => m.isCurrentUser)!;

  const renderItem = (item: NavDef) => {
    if (isChild && item.childHidden) return null;
    const isOverdue = item.id === "today";
    return (
      <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
        <Icon name={item.icon} size={15} />
        <span className="flex-1 text-start">{item.label}</span>
        {item.badge && !isChild && (
          <span className="badge bg-sig-over-bg text-sig-over" style={{ fontSize: 10 }}>{item.badge}</span>
        )}
      </button>
    );
  };

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-4 pb-3 border-b border-line" style={{ borderColor: "var(--line)" }}>
        <LogoMark size={28} theme={theme} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-primary leading-tight" style={{ fontSize: 14 }}>DayDan</div>
          <div className="text-faint" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" }}>
            {isChild ? "QUEST" : view === "quest" ? "QUEST MODE" : "FOCUS MODE"}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onOpenCreate} title="New task" style={{ color: "var(--brand)" }}>
          <Icon name="plus" size={16} />
        </button>
      </div>

      {/* View toggle */}
      {!isChild && (
        <div className="px-3 py-3 border-b border-line" style={{ borderColor: "var(--line)" }}>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${view === "focus" ? "active" : ""}`} onClick={() => onViewChange("focus")}>Focus</button>
            <button className={`view-toggle-btn ${view === "quest" ? "active" : ""}`} onClick={() => onViewChange("quest")}>Quest</button>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_PRIMARY.map(renderItem)}
        <div className="section-label">Organize</div>
        {NAV_ORGANIZE.map(renderItem)}
        <div className="section-label">Household</div>
        {NAV_HOUSEHOLD.map(renderItem)}
        <button className={`nav-item ${screen === "search" ? "active" : ""}`} onClick={() => onNavigate("search")}>
          <Icon name="search" size={15} />
          <span className="flex-1 text-start">Search</span>
          <span className="text-faint font-mono" style={{ fontSize: 10 }}>⌘K</span>
        </button>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-line px-2 pt-2 pb-3 flex flex-col gap-1" style={{ borderColor: "var(--line)" }}>
        {/* Prototype persona switcher */}
        <div className="px-1 mb-1">
          <div className="section-label" style={{ padding: "4px 0 4px", fontSize: 9 }}>DEMO PERSONA</div>
          <div className="flex gap-1">
            {(["parent", "child", "solo"] as Persona[]).map(p => (
              <button key={p} onClick={() => onPersonaChange(p)}
                className="flex-1 btn btn-sm capitalize"
                style={{
                  background: persona === p ? "var(--brand)" : "var(--surface-2)",
                  color: persona === p ? "var(--brand-contrast)" : "var(--t-muted)",
                  fontSize: 10, padding: "3px 5px", minHeight: 24, borderRadius: "var(--r-sm)", border: "none",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Theme switcher */}
        <div className="px-1 mb-1">
          <div className="section-label" style={{ padding: "4px 0 4px", fontSize: 9 }}>THEME</div>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${theme === "daydan" ? "active" : ""}`} onClick={() => onThemeChange("daydan")}>DayDan</button>
            <button className={`view-toggle-btn ${theme === "sovereign" ? "active" : ""}`} onClick={() => onThemeChange("sovereign")}>Sovereign</button>
          </div>
        </div>

        <button className="nav-item" onClick={onToggleRTL} style={{ fontSize: 12 }}>
          <Icon name="globe" size={14} />
          <span>{isRTL ? "Switch to LTR" : "العربية (RTL)"}</span>
        </button>
        <button className={`nav-item ${screen === "error" ? "active" : ""}`} onClick={() => onNavigate("error")}>
          <Icon name="error" size={14} />
          <span className="flex-1 text-start">Error Demo</span>
        </button>
        <button className={`nav-item ${screen === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}>
          <Icon name="settings" size={14} />
          <span>Settings</span>
        </button>
        <div className="flex items-center gap-2 px-2 py-2 cursor-pointer rounded-lg hover:bg-surface-2" style={{ borderRadius: "var(--r-md)" }} onClick={() => onNavigate("settings")}>
          <div className="avatar" style={{ width: 30, height: 30, background: currentMember.avatarColor, fontSize: 11 }}>
            {currentMember.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-primary truncate" style={{ fontSize: 13 }}>{currentMember.name}</div>
            <div className="text-faint truncate capitalize" style={{ fontSize: 10 }}>{currentMember.role}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─── Mobile bottom nav ──────────────── */
function MobileNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const items: { id: Screen; icon: string; label: string }[] = [
    { id: "home", icon: "home", label: "Home" },
    { id: "today", icon: "today", label: "Today" },
    { id: "shopping", icon: "shopping", label: "Lists" },
    { id: "goals", icon: "goals", label: "Goals" },
    { id: "settings", icon: "settings", label: "More" },
  ];
  return (
    <div className="mobile-nav">
      <div className="flex w-full">
        {items.map(item => (
          <button key={item.id}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: screen === item.id ? "var(--brand)" : "var(--t-muted)", fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer" }}
            onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────── */
function ToastContainer({ toasts }: { toasts: { id: string; msg: string }[] }) {
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}

/* ─── App ────────────────────────────── */
export default function App() {
  const [theme, setThemeState] = useState<Theme>("daydan");
  const [view, setViewState] = useState<View>("focus");
  const [persona, setPersonaState] = useState<Persona>("parent");
  const [screen, setScreen] = useState<Screen>("home");
  const [isRTL, setIsRTL] = useState(false);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const [tasks, setTasks] = useState<Task[]>(TASKS);

  useEffect(() => {
    const html = document.documentElement;
    document.body.classList.add("theme-transitioning");
    theme === "sovereign" ? html.setAttribute("data-theme", "sovereign") : html.removeAttribute("data-theme");
    const t = setTimeout(() => document.body.classList.remove("theme-transitioning"), 350);
    return () => clearTimeout(t);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", isRTL ? "ar" : "en");
  }, [isRTL]);

  useEffect(() => {
    if (persona === "child") setViewState("quest");
    else setViewState("focus");
  }, [persona]);

  const showToast = useCallback((msg: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2900);
  }, []);

  const setTheme = (t: Theme) => { setThemeState(t); showToast(`Switched to ${t === "daydan" ? "DayDan" : "Sovereign"} theme`); };
  const setView = (v: View) => { setViewState(v); showToast(`${v === "focus" ? "Focus" : "Quest"} view active`); };
  const setPersona = (p: Persona) => { setPersonaState(p); showToast(`Demo: ${p} persona`); };
  const toggleRTL = () => { setIsRTL(r => !r); };

  const navigate = (s: Screen) => setScreen(s);
  const openTask = (t: Task) => setTaskDetail(t);
  const closeTask = () => setTaskDetail(null);
  const openCreate = () => setShowCreateTask(true);
  const closeCreate = () => setShowCreateTask(false);

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" as const, completedAt: new Date().toISOString() } : t));
    showToast("Task completed ✓");
    setTaskDetail(null);
  };

  const ctx: AppCtx = {
    theme, view, persona, screen, isRTL, taskDetail, showCreateTask,
    navigate, setView, setTheme, setPersona, toggleRTL,
    openTask, closeTask, openCreate, closeCreate, showToast,
  };

  const activeView = persona === "child" ? "quest" : view;
  const isSolo = persona === "solo";
  const isChild = persona === "child";

  const renderScreen = () => {
    switch (screen) {
      case "home": return activeView === "quest" ? <QuestHome ctx={ctx} tasks={tasks} isSolo={isSolo} /> : <FocusHome ctx={ctx} tasks={tasks} isSolo={isSolo} />;
      case "today": return <TodayScreen ctx={ctx} tasks={tasks} onComplete={completeTask} />;
      case "all-tasks": return <AllTasksScreen ctx={ctx} tasks={tasks} onComplete={completeTask} />;
      case "calendar": return <CalendarScreen ctx={ctx} tasks={tasks} />;
      case "projects": return <ProjectsScreen ctx={ctx} />;
      case "routines": return <RoutinesScreen ctx={ctx} />;
      case "maintenance": return <MaintenanceScreen ctx={ctx} />;
      case "shopping": return <ShoppingScreen ctx={ctx} isSolo={isSolo} />;
      case "goals": return <GoalsScreen ctx={ctx} isSolo={isSolo} isChild={isChild} />;
      case "activity": return <ActivityScreen ctx={ctx} isSolo={isSolo} />;
      case "settings": return <SettingsScreen ctx={ctx} isSolo={isSolo} />;
      case "search": return <SearchScreen ctx={ctx} />;
      case "error": return <ErrorScreen ctx={ctx} />;
      default: return <FocusHome ctx={ctx} tasks={tasks} isSolo={isSolo} />;
    }
  };

  return (
    <div className="app-shell" style={{ fontFamily: "var(--font-ui)" }}>
      <Sidebar
        screen={screen} view={activeView} theme={theme} persona={persona} isRTL={isRTL}
        onNavigate={navigate} onViewChange={setView} onThemeChange={setTheme}
        onPersonaChange={setPersona} onToggleRTL={toggleRTL} onOpenCreate={openCreate}
      />
      <main className="main-content" id="main-content">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2 md:hidden">
            <LogoMark size={22} theme={theme} />
            <span className="font-bold text-primary" style={{ fontSize: 15 }}>DayDan</span>
          </div>
          {/* Desktop search bar */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-muted" style={{ background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 13, cursor: "text", width: 200 }} onClick={() => navigate("search")}>
            <Icon name="search" size={14} />
            Search...
            <span className="ms-auto font-mono text-faint" style={{ fontSize: 10 }}>⌘K</span>
          </button>
          <div className="flex gap-2 ms-auto">
            <button className="btn btn-ghost btn-icon md:hidden" onClick={() => navigate("search")}><Icon name="search" size={18} /></button>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate("activity")}><Icon name="bell" size={18} /></button>
            <button className="btn btn-primary btn-icon" onClick={openCreate} style={{ borderRadius: "var(--r-md)" }}><Icon name="plus" size={18} /></button>
          </div>
        </div>
        {renderScreen()}
      </main>
      <MobileNav screen={screen} onNavigate={navigate} />

      {taskDetail && <TaskDetailModal task={taskDetail} ctx={ctx} onComplete={completeTask} />}
      {showCreateTask && <CreateTaskModal ctx={ctx} onCreated={(title: string) => {
        const newTask: Task = { id: `task-${Date.now()}`, title, status: "todo", priority: "medium", assigneeId: isChild ? "liam" : "sarah", dueDate: "2026-08-15", points: 15 };
        setTasks(prev => [newTask, ...prev]);
      }} />}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
