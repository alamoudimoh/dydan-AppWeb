import { AppCtx, Icon } from "../App";
import { GOALS, MEMBERS, REWARDS, getMemberById } from "../data";

export default function GoalsScreen({ ctx, isSolo, isChild }: { ctx: AppCtx; isSolo: boolean; isChild: boolean }) {
  const currentMember = isChild ? MEMBERS.find(m => m.role === "child")! : MEMBERS.find(m => m.isCurrentUser)!;
  const myGoals = isChild ? GOALS.filter(g => g.contributorIds?.includes("liam")) : GOALS;
  const familyGoals = myGoals.filter(g => g.isFamily);
  const personalGoals = myGoals.filter(g => !g.isFamily);
  const canRedeem = REWARDS.filter(r => currentMember.points >= r.pointsCost);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Goals & Progress</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Track what you're working toward</div>
        </div>
        {!isChild && <button className="btn btn-primary" onClick={ctx.openCreate}><Icon name="plus" size={14} />New goal</button>}
      </div>

      <div className="px-4 md:px-7">
        {/* Points summary */}
        <div className="card p-5 mb-5" style={{ background: "linear-gradient(135deg, var(--brand-faint) 0%, var(--accent-bg) 100%)", border: "1px solid var(--brand)" }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-muted mb-1" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {currentMember.name}&apos;s points
              </div>
              <div className="flex items-center gap-2">
                <Icon name="star" size={24} style={{ color: "var(--brand)" }} />
                <span className="font-bold text-primary" style={{ fontSize: 36, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{currentMember.points}</span>
              </div>
              <div className="text-muted mt-1" style={{ fontSize: 12 }}>{currentMember.streak}-day streak · {currentMember.tasksCompleted} tasks completed</div>
            </div>
            <div className="flex flex-col gap-2">
              {canRedeem.length > 0 ? (
                <div className="badge bg-sig-done-bg text-sig-done" style={{ padding: "8px 16px", fontSize: 13 }}>
                  🎉 {canRedeem.length} reward{canRedeem.length > 1 ? "s" : ""} available!
                </div>
              ) : (
                <div className="text-muted" style={{ fontSize: 12 }}>Keep going — rewards await!</div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.navigate("activity")}>View history</button>
            </div>
          </div>
        </div>

        {/* Family goals */}
        {!isSolo && familyGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-primary font-bold mb-3" style={{ fontSize: 16, margin: "0 0 12px" }}>Family goals</h2>
            {familyGoals.map(g => (
              <div key={g.id} className="card p-5 mb-3">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 32 }}>{g.emoji}</span>
                    <div>
                      <div className="font-bold text-primary" style={{ fontSize: 15 }}>{g.name}</div>
                      {g.description && <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{g.description}</div>}
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div className="font-bold" style={{ fontSize: 22, color: g.color, fontFamily: "var(--font-mono)" }}>
                      {Math.round((g.progress / g.target) * 100)}%
                    </div>
                    <div className="text-faint" style={{ fontSize: 11 }}>{g.progress}/{g.target} {g.unit}</div>
                  </div>
                </div>
                <div className="progress-track mb-3" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${(g.progress / g.target) * 100}%`, background: g.color }} />
                </div>
                {g.reward && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--sig-flag-bg)", borderRadius: "var(--r-md)" }}>
                    <Icon name="gift" size={16} style={{ color: "var(--sig-flag)" }} />
                    <div>
                      <div className="font-semibold" style={{ fontSize: 12, color: "var(--sig-flag)" }}>Reward on completion</div>
                      <div className="text-primary" style={{ fontSize: 13 }}>{g.reward}</div>
                    </div>
                  </div>
                )}
                {g.contributorIds && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-faint" style={{ fontSize: 12 }}>Contributors:</span>
                    {g.contributorIds.map(id => {
                      const m = getMemberById(id);
                      return m ? <div key={id} className="avatar" style={{ width: 22, height: 22, background: m.avatarColor, fontSize: 8 }}>{m.initials}</div> : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Personal goals */}
        {personalGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-primary font-bold mb-3" style={{ fontSize: 16, margin: "0 0 12px" }}>Personal goals</h2>
            {personalGoals.map(g => (
              <div key={g.id} className="card p-5 mb-3">
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontSize: 28 }}>{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-primary" style={{ fontSize: 14 }}>{g.name}</div>
                    {g.description && <div className="text-muted" style={{ fontSize: 12 }}>{g.description}</div>}
                  </div>
                  <div className="font-bold" style={{ fontSize: 20, color: g.color, fontFamily: "var(--font-mono)" }}>
                    {g.progress}/{g.target}
                  </div>
                </div>
                <div className="progress-track mb-2" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${(g.progress / g.target) * 100}%`, background: g.color }} />
                </div>
                <div className="flex justify-between text-faint" style={{ fontSize: 11 }}>
                  <span>{g.unit}</span>
                  <span>{Math.round((g.progress / g.target) * 100)}% complete</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards section */}
        <div>
          <h2 className="text-primary font-bold mb-3" style={{ fontSize: 16, margin: "0 0 12px" }}>Rewards</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {REWARDS.filter(r => !isChild || r.forMemberId === "liam").map(r => {
              const can = currentMember.points >= r.pointsCost;
              const pct = Math.min(100, Math.round((currentMember.points / r.pointsCost) * 100));
              return (
                <div key={r.id} className="card p-4 flex flex-col gap-3" style={{ opacity: can ? 1 : 0.8 }}>
                  <div style={{ fontSize: 32, lineHeight: 1 }}>{r.icon}</div>
                  <div>
                    <div className="font-bold text-primary" style={{ fontSize: 13 }}>{r.name}</div>
                    {r.description && <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{r.description}</div>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-bold" style={{ fontSize: 14, color: "var(--brand)", fontFamily: "var(--font-mono)" }}>
                      <Icon name="star" size={12} />
                      {r.pointsCost}
                    </div>
                    {can ? (
                      <button className="btn btn-sm btn-primary">Redeem</button>
                    ) : (
                      <span className="text-faint" style={{ fontSize: 11 }}>{pct}%</span>
                    )}
                  </div>
                  {!can && (
                    <div className="progress-track" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isChild && !isSolo && (
            <button className="btn btn-secondary mt-3 w-full" onClick={ctx.openCreate}>
              <Icon name="plus" size={14} />Create new reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
