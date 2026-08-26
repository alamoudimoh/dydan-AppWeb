import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { Task, CALENDAR_EVENTS, getMemberById, formatDate } from "../data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CalendarScreen({ ctx, tasks }: { ctx: AppCtx; tasks: Task[] }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7); // August = 7
  const [selectedDay, setSelectedDay] = useState(15);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return CALENDAR_EVENTS.filter(e => e.date === dateStr);
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const selectedEvents = CALENDAR_EVENTS.filter(e => e.date === selectedDateStr);
  const selectedTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const today = { year: 2026, month: 7, day: 15 };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Calendar</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Scheduled tasks and events</div>
        </div>
        <div className="flex gap-2">
          <div className="view-toggle" style={{ width: "auto" }}>
            <button className={`view-toggle-btn ${viewMode === "month" ? "active" : ""}`} onClick={() => setViewMode("month")}>Month</button>
            <button className={`view-toggle-btn ${viewMode === "week" ? "active" : ""}`} onClick={() => setViewMode("week")}>Week</button>
          </div>
          <button className="btn btn-primary" onClick={ctx.openCreate}><Icon name="plus" size={14} />Add</button>
        </div>
      </div>

      <div className="px-4 md:px-7">
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
          {/* Calendar grid */}
          <div className="card overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <button className="btn btn-ghost btn-icon" onClick={prevMonth}><Icon name="chevron_right" size={16} style={{ transform: "rotate(180deg)" }} /></button>
              <div className="font-bold text-primary" style={{ fontSize: 16 }}>{MONTHS[month]} {year}</div>
              <button className="btn btn-ghost btn-icon" onClick={nextMonth}><Icon name="chevron_right" size={16} /></button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
              {DAYS.map(d => (
                <div key={d} className="text-faint text-center py-2" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const day = i - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = isValid && year === today.year && month === today.month && day === today.day;
                const isSelected = isValid && day === selectedDay;
                const events = isValid ? getEventsForDay(day) : [];

                return (
                  <div
                    key={i}
                    className="p-1.5 cursor-pointer border-b border-line"
                    style={{ borderColor: "var(--line)", borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--line)" : "none", minHeight: 70, background: isSelected ? "var(--brand-faint)" : "transparent", opacity: isValid ? 1 : 0.3 }}
                    onClick={() => isValid && setSelectedDay(day)}
                  >
                    {isValid && (
                      <>
                        <div className="flex items-center justify-center"
                          style={{ width: 24, height: 24, borderRadius: "50%", background: isToday ? "var(--brand)" : "transparent", color: isToday ? "var(--brand-contrast)" : isSelected ? "var(--brand)" : "var(--t-primary)", fontSize: 13, fontWeight: isToday || isSelected ? 800 : 500 }}>
                          {day}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {events.slice(0, 2).map(e => (
                            <div key={e.id} className="rounded px-1" style={{ background: `color-mix(in srgb, ${e.color} 13%, transparent)`, borderLeft: `2px solid ${e.color}`, fontSize: 10, fontWeight: 600, color: e.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {e.title}
                            </div>
                          ))}
                          {events.length > 2 && <div className="text-faint" style={{ fontSize: 9, paddingLeft: 2 }}>+{events.length - 2} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          <div className="flex flex-col gap-3">
            <div className="card p-4">
              <div className="font-bold text-primary mb-3" style={{ fontSize: 15 }}>
                {DAYS[new Date(year, month, selectedDay).getDay() === 0 ? 6 : new Date(year, month, selectedDay).getDay() - 1]}, {selectedDay} {MONTHS[month]}
              </div>
              {selectedEvents.length === 0 && selectedTasks.length === 0 ? (
                <div className="text-center py-6">
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>Nothing scheduled</div>
                  <button className="btn btn-sm btn-secondary mt-3" onClick={ctx.openCreate}>
                    <Icon name="plus" size={12} />Add task
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedEvents.map(e => {
                    const assignee = e.assigneeId ? getMemberById(e.assigneeId) : null;
                    return (
                      <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: `color-mix(in srgb, ${e.color} 7%, transparent)`, borderLeft: `3px solid ${e.color}`, borderRadius: "0 var(--r-sm) var(--r-sm) 0" }}>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold" style={{ fontSize: 12, color: e.color }}>{e.title}</div>
                          {e.time && <div className="text-faint" style={{ fontSize: 10 }}>{e.time}</div>}
                        </div>
                        {assignee && <div className="avatar" style={{ width: 18, height: 18, background: assignee.avatarColor, fontSize: 7 }}>{assignee.initials}</div>}
                      </div>
                    );
                  })}
                  {selectedTasks.filter(t => !CALENDAR_EVENTS.find(e => e.title === t.title)).map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)" }} onClick={() => ctx.openTask(t)}>
                      <div className="task-check" style={{ width: 16, height: 16, borderRadius: 4, borderColor: t.status === "done" ? "var(--sig-done)" : "var(--line-strong)", background: t.status === "done" ? "var(--sig-done)" : "transparent", flexShrink: 0, cursor: "pointer" }}>
                        {t.status === "done" && <Icon name="check" size={9} style={{ color: "white" }} />}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--t-primary)", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events summary */}
            <div className="card p-4">
              <div className="font-bold text-primary mb-3" style={{ fontSize: 13 }}>Upcoming events</div>
              {CALENDAR_EVENTS.filter(e => e.date >= selectedDateStr).slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center gap-2 py-2 border-b border-line" style={{ borderColor: "var(--line)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-primary truncate" style={{ fontSize: 12 }}>{e.title}</div>
                    <div className="text-faint" style={{ fontSize: 10 }}>{formatDate(e.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
