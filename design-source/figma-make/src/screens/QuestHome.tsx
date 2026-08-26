import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { Task, MEMBERS, REWARDS, GOALS, ACTIVITY, getMemberById, formatTimestamp, getChildTasks } from "../data";

function StreakPips({ streak, total = 14 }: { streak: number; total?: number }) {
  return (
    <div className="streak-pips flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`streak-pip ${i < streak - 1 ? "active" : i === streak - 1 ? "today" : ""}`}
          style={i === streak - 1 ? { background: "var(--accent)" } : {}}
        />
      ))}
    </div>
  );
}

function QuestTaskCard({ task, onComplete, onOpen }: { task: Task; onComplete: (id: string) => void; onOpen: () => void }) {
  const isDone = task.status === "done";
  return (
    <div
      className="card p-4 cursor-pointer"
      style={{
        border: isDone ? `1px solid var(--sig-done)` : "1px solid var(--line)",
        background: isDone ? "var(--sig-done-bg)" : "var(--surface)",
        opacity: isDone ? 0.8 : 1,
      }}
      onClick={onOpen}
    >
      <div className="flex items-center gap-3">
        <button
          className={`task-check ${isDone ? "checked" : ""}`}
          style={{ width: 26, height: 26, borderRadius: "var(--r-sm)" }}
          onClick={e => { e.stopPropagation(); if (!isDone) onComplete(task.id); }}
          aria-label={isDone ? "Done" : "Complete"}
        >
          {isDone && <Icon name="check" size={13} style={{ color: "white" }} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold" style={{ fontSize: 14, color: isDone ? "var(--sig-done)" : "var(--t-primary)", textDecoration: isDone ? "line-through" : "none" }}>
            {task.title}
          </div>
          {task.subtasks && !isDone && (
            <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
              {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} steps
            </div>
          )}
        </div>
        {task.points && (
          <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: isDone ? "var(--sig-done)" : "var(--brand-faint)", color: isDone ? "white" : "var(--brand)", fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
            <Icon name="star" size={10} />
            {task.points}
          </div>
        )}
      </div>
    </div>
  );
}

function RewardCard({ reward, currentPoints }: { reward: typeof REWARDS[0]; currentPoints: number }) {
  const canRedeem = currentPoints >= reward.pointsCost;
  const pct = Math.min(100, Math.round((currentPoints / reward.pointsCost) * 100));
  return (
    <div className="reward-card" style={{ opacity: canRedeem ? 1 : 0.75 }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{reward.icon}</div>
      <div className="font-bold text-primary" style={{ fontSize: 13 }}>{reward.name}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-brand" style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
          <Icon name="star" size={10} />
          {reward.pointsCost}
        </div>
        {canRedeem ? (
          <span className="badge bg-sig-done-bg text-sig-done">Redeem!</span>
        ) : (
          <span className="text-faint" style={{ fontSize: 11 }}>{pct}%</span>
        )}
      </div>
      {!canRedeem && (
        <div className="progress-track" style={{ height: 4 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function QuestHome({ ctx, tasks, isSolo }: { ctx: AppCtx; tasks: Task[]; isSolo: boolean }) {
  const liam = MEMBERS.find(m => m.role === "child")!;
  const persona = ctx.persona;
  const currentMember = persona === "child" ? liam : MEMBERS.find(m => m.isCurrentUser)!;
  const childTasks = getChildTasks().map(t => tasks.find(x => x.id === t.id) || t);
  const todayTasks = childTasks.filter(t => t.dueDate === "2026-08-15" || t.status === "done");
  const done = todayTasks.filter(t => t.status === "done");
  const todo = todayTasks.filter(t => t.status === "todo");
  const progressPct = todayTasks.length ? Math.round((done.length / todayTasks.length) * 100) : 0;
  const familyGoal = GOALS.find(g => g.isFamily);
  const personalGoal = GOALS.find(g => !g.isFamily && g.contributorIds?.includes("liam"));

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, var(--accent)) 100%)", padding: "28px 24px 40px", position: "relative", overflow: "hidden" }}>
        {/* Background circles */}
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -60, right: -40 }} />
        <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: -20, left: 20 }} />

        <div className="flex items-start justify-between mb-5" style={{ position: "relative" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Quest Mode
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.2 }}>
              {persona === "child" ? `Hey, ${liam.name}! 👋` : `Quest View`}
            </h1>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              {done.length === todayTasks.length && todayTasks.length > 0
                ? "All tasks done! Amazing! 🎉"
                : `${todo.length} quest${todo.length !== 1 ? "s" : ""} to complete today`}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--r-full)", padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="star" size={13} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "white", fontFamily: "var(--font-mono)" }}>{currentMember.points}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>pts</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "var(--r-full)", padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="fire" size={13} style={{ color: "#FF8C42" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{currentMember.streak} day streak</span>
            </div>
          </div>
        </div>

        {/* Daily progress bar */}
        <div>
          <div className="flex justify-between mb-2" style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            <span>Today's progress</span>
            <span style={{ fontWeight: 800 }}>{done.length}/{todayTasks.length}</span>
          </div>
          <div style={{ height: 12, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct === 100 ? "var(--sig-done)" : "var(--accent)", borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6" style={{ marginTop: -16 }}>
        {/* Streak card */}
        <div className="card p-4 mb-4 flex items-center gap-4">
          <div style={{ fontSize: 32 }}>🔥</div>
          <div className="flex-1">
            <div className="font-bold text-primary" style={{ fontSize: 14 }}>{currentMember.streak}-day streak!</div>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>Keep it going — 8 more days to reach your goal</div>
            <StreakPips streak={currentMember.streak} total={20} />
          </div>
        </div>

        {/* Tasks for today */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-primary font-bold" style={{ fontSize: 16, margin: 0 }}>
              My quests today
            </h2>
            <button className="btn btn-ghost btn-sm text-brand" onClick={() => ctx.navigate("all-tasks")}>See all</button>
          </div>

          {todo.length === 0 && done.length > 0 ? (
            <div className="card p-8 text-center">
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
              <div className="font-bold text-primary" style={{ fontSize: 16 }}>All done! Amazing work!</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
                You earned {done.reduce((acc, t) => acc + (t.points || 0), 0)} points today
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todo.map(t => (
                <QuestTaskCard key={t.id} task={t} onComplete={() => {}} onOpen={() => ctx.openTask(t)} />
              ))}
              {done.length > 0 && (
                <>
                  <div className="section-label mt-2">Completed</div>
                  {done.map(t => (
                    <QuestTaskCard key={t.id} task={t} onComplete={() => {}} onOpen={() => ctx.openTask(t)} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Goals section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-primary font-bold" style={{ fontSize: 16, margin: 0 }}>My goals</h2>
            <button className="btn btn-ghost btn-sm text-brand" onClick={() => ctx.navigate("goals")}>Details</button>
          </div>
          <div className="flex flex-col gap-3">
            {personalGoal && (
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 24 }}>{personalGoal.emoji}</span>
                  <div>
                    <div className="font-bold text-primary" style={{ fontSize: 13 }}>{personalGoal.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{personalGoal.progress}/{personalGoal.target} {personalGoal.unit}</div>
                  </div>
                  <div className="ms-auto font-bold" style={{ fontSize: 18, color: "var(--brand)", fontFamily: "var(--font-mono)" }}>
                    {Math.round((personalGoal.progress / personalGoal.target) * 100)}%
                  </div>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${(personalGoal.progress / personalGoal.target) * 100}%` }} />
                </div>
                {personalGoal.reward && (
                  <div className="flex items-center gap-1 mt-2 text-faint" style={{ fontSize: 11 }}>
                    <Icon name="gift" size={11} style={{ color: "var(--sig-flag)" }} />
                    Reward: {personalGoal.reward}
                  </div>
                )}
              </div>
            )}
            {!isSolo && familyGoal && (
              <div className="card p-4" style={{ border: "1px solid var(--brand)", background: "var(--brand-faint)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 24 }}>{familyGoal.emoji}</span>
                  <div>
                    <div className="text-faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Family goal</div>
                    <div className="font-bold text-primary" style={{ fontSize: 13 }}>{familyGoal.name}</div>
                  </div>
                  <div className="ms-auto font-bold text-brand" style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}>
                    {familyGoal.progress}/{familyGoal.target}
                  </div>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${(familyGoal.progress / familyGoal.target) * 100}%` }} />
                </div>
                <div className="flex gap-1 mt-3">
                  {MEMBERS.map(m => (
                    <div key={m.id} className="avatar" style={{ width: 22, height: 22, background: m.avatarColor, fontSize: 8 }}>{m.initials}</div>
                  ))}
                  <span className="text-muted ms-2" style={{ fontSize: 11 }}>All contributing</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-primary font-bold" style={{ fontSize: 16, margin: 0 }}>Rewards</h2>
            <div className="flex items-center gap-1 text-brand font-bold" style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
              <Icon name="star" size={13} />
              {currentMember.points} pts
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {REWARDS.slice(0, 4).map(r => (
              <RewardCard key={r.id} reward={r} currentPoints={currentMember.points} />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {!isSolo && (
          <div className="card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-line font-bold text-primary" style={{ borderColor: "var(--line)", fontSize: 14 }}>
              Recent activity
            </div>
            {ACTIVITY.slice(0, 5).map(a => {
              const actor = getMemberById(a.actorId);
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-line" style={{ borderColor: "var(--line)" }}>
                  <div className="avatar" style={{ width: 28, height: 28, background: actor?.avatarColor || "var(--brand)", fontSize: 10, flexShrink: 0 }}>
                    {actor?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary" style={{ fontSize: 12 }}>{a.text}</div>
                    <div className="text-faint" style={{ fontSize: 10 }}>{formatTimestamp(a.timestamp)}</div>
                  </div>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
