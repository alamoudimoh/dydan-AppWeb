import { AppCtx, Icon } from '../App'
import { EmptyState, PageSection, PageShell } from '../components/page'
import type { Task } from '../data'
import { useLiveData } from '../model/liveData'

export default function SearchScreen({
  ctx,
  query,
  tasks,
}: {
  ctx: AppCtx
  query: string
  tasks: Task[]
}) {
  const { projects, routines, shoppingLists } = useLiveData()
  const q = query.trim().toLowerCase()

  const taskResults = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q))
    : []
  const projectResults = q
    ? projects.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    : []
  const routineResults = q
    ? routines.filter(r => r.name.toLowerCase().includes(q))
    : []
  const shoppingResults = q
    ? shoppingLists.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          l.items.some(i => i.text.toLowerCase().includes(q)),
      )
    : []

  const total =
    taskResults.length +
    projectResults.length +
    routineResults.length +
    shoppingResults.length

  return (
    <PageShell testId='search-page'>
      {q && (
        <PageSection title={`Results for "${query.trim()}"`}>
          <div className='text-muted mt-1' style={{ fontSize: 12 }}>
            {total} results
          </div>
        </PageSection>
      )}
      {!q && (
        <EmptyState
          testId='search-zero-query'
          icon={<span aria-hidden='true'>🔍</span>}
          title='Find anything in dydan'
          description='Type into the top search field to find tasks, projects, routines, and shopping items.'
        />
      )}

      {q && total === 0 && (
        <EmptyState
          testId='search-zero-results'
          icon={<span aria-hidden='true'>🤷</span>}
          title={`Nothing found for "${query}"`}
          description='Try a different search term'
        />
      )}

      {taskResults.length > 0 && (
        <PageSection title={`Tasks (${taskResults.length})`}>
          <div className='card overflow-hidden'>
            {taskResults.map(t => (
              <div
                key={t.id}
                className='task-row'
                onClick={() => ctx.openTask(t)}
              >
                <div
                  className={`task-check ${t.status === 'done' ? 'checked' : ''}`}
                >
                  {t.status === 'done' && (
                    <Icon name='check' size={11} style={{ color: 'white' }} />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div
                    className='text-primary font-medium'
                    style={{
                      fontSize: 14,
                      textDecoration:
                        t.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {t.title}
                  </div>
                  {t.category && (
                    <span className='text-faint' style={{ fontSize: 11 }}>
                      {t.category}
                    </span>
                  )}
                </div>
                {t.dueDate && (
                  <span className='text-faint' style={{ fontSize: 11 }}>
                    {t.dueDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {projectResults.length > 0 && (
        <PageSection title={`Projects (${projectResults.length})`}>
          <div className='card overflow-hidden'>
            {projectResults.map(p => (
              <button
                key={p.id}
                className='task-row w-full text-start'
                onClick={() => ctx.navigate('projects')}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--r-xs)',
                    background: p.color,
                    flexShrink: 0,
                  }}
                />
                <div className='flex-1 min-w-0'>
                  <div
                    className='text-primary font-medium'
                    style={{ fontSize: 14 }}
                  >
                    {p.name}
                  </div>
                  <div className='text-faint' style={{ fontSize: 11 }}>
                    {p.description}
                  </div>
                </div>
                <span className='text-faint' style={{ fontSize: 11 }}>
                  {p.progress}%
                </span>
              </button>
            ))}
          </div>
        </PageSection>
      )}

      {routineResults.length > 0 && (
        <PageSection title={`Routines (${routineResults.length})`}>
          <div className='card overflow-hidden'>
            {routineResults.map(r => (
              <button
                key={r.id}
                className='task-row w-full text-start'
                onClick={() => ctx.navigate('routines')}
              >
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <div className='flex-1 min-w-0'>
                  <div
                    className='text-primary font-medium'
                    style={{ fontSize: 14 }}
                  >
                    {r.name}
                  </div>
                  <div className='text-faint' style={{ fontSize: 11 }}>
                    {r.schedule}
                  </div>
                </div>
                <span
                  className='badge bg-sig-done-bg text-sig-done'
                  style={{ fontSize: 10 }}
                >
                  🔥 {r.streak}d
                </span>
              </button>
            ))}
          </div>
        </PageSection>
      )}

      {shoppingResults.length > 0 && (
        <PageSection title={`Shopping (${shoppingResults.length})`}>
          <div className='card overflow-hidden'>
            {shoppingResults.map(l => (
              <button
                key={l.id}
                className='task-row w-full text-start'
                onClick={() => ctx.navigate('shopping')}
              >
                <span style={{ fontSize: 20 }}>{l.emoji}</span>
                <div className='flex-1 min-w-0'>
                  <div
                    className='text-primary font-medium'
                    style={{ fontSize: 14 }}
                  >
                    {l.name}
                  </div>
                  <div className='text-faint' style={{ fontSize: 11 }}>
                    {l.items.filter(i => !i.done).length} items remaining
                  </div>
                </div>
                {l.isShared && (
                  <span
                    className='badge bg-brand-faint text-brand'
                    style={{ fontSize: 10 }}
                  >
                    Shared
                  </span>
                )}
              </button>
            ))}
          </div>
        </PageSection>
      )}
    </PageShell>
  )
}
