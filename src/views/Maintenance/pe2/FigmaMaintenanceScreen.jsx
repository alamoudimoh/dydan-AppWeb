/* ─────────────────────────────────────────────
   PE2 MaintenanceScreen port. The inner MaintenanceScreen
   component is a verbatim JS port of
   Dydan-AppWebProductExperience02/src/screens/MaintenanceScreen.tsx
   (assets / meters / things tabs, alert banner, expandable
   meter readings and thing history), rendered with PE2
   fixture data (MAINTENANCE_ITEMS + METERS + THINGS) through
   the shared pe2 task-store ctx.
───────────────────────────────────────────── */
import { useState } from 'react'

import FigmaIcon from '../../../components/FigmaIcon'
import {
  formatDate,
  formatTimestamp,
  getMemberById,
  MAINTENANCE_ITEMS,
  METERS,
  THINGS,
} from '../../../pe2/fixtures'
import {
  ConfirmDialog,
  CreateTaskModal,
  TaskDetailModal,
  ToastContainer,
  usePe2Tasks,
} from '../../../pe2/pe2Ui'

const statusColor = s =>
  s === 'overdue'
    ? 'var(--sig-over)'
    : s === 'due-soon'
      ? 'var(--sig-due)'
      : 'var(--sig-done)'
const statusBg = s =>
  s === 'overdue'
    ? 'var(--sig-over-bg)'
    : s === 'due-soon'
      ? 'var(--sig-due-bg)'
      : 'var(--sig-done-bg)'
const statusLabel = s =>
  s === 'overdue' ? 'Overdue' : s === 'due-soon' ? 'Due soon' : 'OK'

function MaintenanceScreen({ ctx }) {
  const [tab, setTab] = useState('assets')
  const [thingStates, setThingStates] = useState(() =>
    Object.fromEntries(THINGS.map(t => [t.id, t.state])),
  )
  const [expandedThing, setExpandedThing] = useState(null)
  const [expandedMeter, setExpandedMeter] = useState(null)

  const alertCount =
    MAINTENANCE_ITEMS.filter(m => m.status !== 'ok').length +
    METERS.filter(m => m.status !== 'ok').length

  const toggleThing = (id, currentState, type) => {
    if (type === 'toggle') {
      const next =
        currentState === 'on' ||
        currentState === 'yes' ||
        currentState === 'locked'
          ? currentState === 'locked'
            ? 'unlocked'
            : currentState === 'yes'
              ? 'no'
              : 'off'
          : currentState === 'unlocked'
            ? 'locked'
            : currentState === 'no'
              ? 'yes'
              : 'on'
      setThingStates(prev => ({ ...prev, [id]: next }))
      ctx.showToast(`Updated to ${next}`)
    } else {
      ctx.showToast('Update state — coming soon')
    }
  }

  const thingStateColor = state => {
    if (['on', 'yes', 'locked', 'clean', 'running'].includes(state))
      return 'var(--sig-done)'
    if (['off', 'no', 'unlocked', 'dirty'].includes(state))
      return 'var(--t-muted)'
    return 'var(--brand)'
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Maintenance
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Assets, meters, and smart-home things
          </div>
        </div>
        <button className='btn btn-primary' onClick={ctx.openCreate}>
          <FigmaIcon name='plus' size={14} />
          {tab === 'assets'
            ? 'Add asset'
            : tab === 'meters'
              ? 'Add meter'
              : 'Add thing'}
        </button>
      </div>

      <div className='px-4 md:px-7'>
        {/* Alert banner */}
        {alertCount > 0 && (
          <div
            className='rounded-lg p-4 mb-5'
            style={{
              background: 'var(--sig-due-bg)',
              border: '1px solid var(--sig-due)',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <div className='flex items-center gap-2'>
              <FigmaIcon
                name='error'
                size={15}
                style={{ color: 'var(--sig-due)' }}
              />
              <span
                className='font-bold'
                style={{ fontSize: 13, color: 'var(--sig-due)' }}
              >
                {alertCount} item{alertCount !== 1 ? 's' : ''} need attention
              </span>
            </div>
          </div>
        )}

        {/* Tab strip */}
        <div
          className='flex gap-1 mb-5 p-1'
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {[
            { id: 'assets', label: 'Assets', count: MAINTENANCE_ITEMS.length },
            { id: 'meters', label: 'Meters', count: METERS.length },
            { id: 'things', label: 'Things', count: THINGS.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className='flex-1 flex items-center justify-center gap-1.5 py-2 font-semibold'
              style={{
                background: tab === t.id ? 'var(--surface)' : 'transparent',
                color: tab === t.id ? 'var(--t-primary)' : 'var(--t-muted)',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                fontFamily: 'var(--font-ui)',
                boxShadow: tab === t.id ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
              <span
                className='badge'
                style={{
                  background: 'var(--line)',
                  color: 'var(--t-muted)',
                  fontSize: 10,
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Assets tab ── */}
        {tab === 'assets' && (
          <div className='flex flex-col gap-3'>
            {MAINTENANCE_ITEMS.map(item => {
              const assignee = item.assigneeId
                ? getMemberById(item.assigneeId)
                : null
              return (
                <div key={item.id} className='card p-5'>
                  <div className='flex items-start gap-4'>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--r-lg)',
                        background: `color-mix(in srgb, ${statusColor(item.status)} 10%, transparent)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between flex-wrap gap-2'>
                        <div
                          className='font-bold text-primary'
                          style={{ fontSize: 15 }}
                        >
                          {item.name}
                        </div>
                        <span
                          className='badge'
                          style={{
                            background: statusBg(item.status),
                            color: statusColor(item.status),
                            fontSize: 11,
                          }}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      {item.description && (
                        <div
                          className='text-muted mb-2'
                          style={{ fontSize: 12, marginTop: 2 }}
                        >
                          {item.description}
                        </div>
                      )}
                      <div className='flex flex-wrap gap-4 mt-2'>
                        <div>
                          <div
                            className='text-faint'
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            Next due
                          </div>
                          <div
                            className='font-semibold'
                            style={{
                              fontSize: 13,
                              color: statusColor(item.status),
                            }}
                          >
                            {formatDate(item.nextDue)}
                          </div>
                        </div>
                        {item.lastDone && (
                          <div>
                            <div
                              className='text-faint'
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Last done
                            </div>
                            <div
                              className='text-muted'
                              style={{ fontSize: 13 }}
                            >
                              {formatDate(item.lastDone)}
                            </div>
                          </div>
                        )}
                        <div>
                          <div
                            className='text-faint'
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            Interval
                          </div>
                          <div className='text-muted' style={{ fontSize: 13 }}>
                            Every {item.intervalDays} days
                          </div>
                        </div>
                        <div>
                          <div
                            className='text-faint'
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            Category
                          </div>
                          <div className='text-muted' style={{ fontSize: 13 }}>
                            {item.category}
                          </div>
                        </div>
                      </div>
                      {assignee && (
                        <div className='flex items-center gap-1 mt-3'>
                          <div
                            className='avatar'
                            style={{
                              width: 20,
                              height: 20,
                              background: assignee.avatarColor,
                              fontSize: 8,
                            }}
                          >
                            {assignee.initials}
                          </div>
                          <span className='text-faint' style={{ fontSize: 11 }}>
                            Assigned to {assignee.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <button
                        className='btn btn-sm btn-secondary'
                        onClick={() => ctx.showToast('Marked as done ✓')}
                      >
                        Mark done
                      </button>
                      <button
                        className='btn btn-sm btn-ghost'
                        onClick={ctx.openCreate}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Meters tab ── */}
        {tab === 'meters' && (
          <div className='flex flex-col gap-3'>
            {METERS.map(meter => {
              const assignee = meter.assigneeId
                ? getMemberById(meter.assigneeId)
                : null
              const isExpanded = expandedMeter === meter.id
              const delta =
                meter.previousReading != null
                  ? meter.currentReading - meter.previousReading
                  : null

              return (
                <div key={meter.id} className='card overflow-hidden'>
                  <button
                    className='w-full flex items-center gap-4 px-5 py-4'
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'start',
                      fontFamily: 'var(--font-ui)',
                    }}
                    onClick={() =>
                      setExpandedMeter(isExpanded ? null : meter.id)
                    }
                  >
                    <div style={{ fontSize: 28, lineHeight: 1 }}>
                      {meter.icon}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between flex-wrap gap-2'>
                        <div
                          className='font-bold text-primary'
                          style={{ fontSize: 15 }}
                        >
                          {meter.name}
                        </div>
                        <span
                          className='badge'
                          style={{
                            background: statusBg(meter.status),
                            color: statusColor(meter.status),
                            fontSize: 11,
                          }}
                        >
                          {statusLabel(meter.status)}
                        </span>
                      </div>
                      <div className='flex items-baseline gap-1 mt-1'>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: 'var(--t-primary)',
                          }}
                        >
                          {meter.currentReading.toLocaleString()}
                        </span>
                        <span className='text-muted' style={{ fontSize: 13 }}>
                          {meter.unit}
                        </span>
                        {delta != null && (
                          <span
                            className='ms-2 text-muted'
                            style={{ fontSize: 12 }}
                          >
                            (+{delta.toFixed(1)} since last reading)
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 mt-1 flex-wrap'>
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          Updated {formatDate(meter.lastUpdated)}
                        </span>
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          Due {formatDate(meter.nextDue)}
                        </span>
                        {assignee && (
                          <div className='flex items-center gap-1'>
                            <div
                              className='avatar'
                              style={{
                                width: 16,
                                height: 16,
                                background: assignee.avatarColor,
                                fontSize: 7,
                              }}
                            >
                              {assignee.initials}
                            </div>
                            <span
                              className='text-faint'
                              style={{ fontSize: 11 }}
                            >
                              {assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <FigmaIcon
                      name='chevron_down'
                      size={16}
                      style={{
                        color: 'var(--t-faint)',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      className='border-t px-5 py-4'
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {meter.notes && (
                        <div
                          className='text-muted mb-3'
                          style={{ fontSize: 13 }}
                        >
                          {meter.notes}
                        </div>
                      )}
                      <div
                        className='section-label mb-3'
                        style={{ padding: 0 }}
                      >
                        Add reading
                      </div>
                      <div className='flex gap-2'>
                        <input
                          type='number'
                          placeholder={`Current reading in ${meter.unit}`}
                          className='flex-1 px-3 py-2 rounded-lg border font-mono'
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--line)',
                            color: 'var(--t-primary)',
                            fontSize: 13,
                            fontFamily: 'var(--font-mono)',
                            borderRadius: 'var(--r-md)',
                          }}
                        />
                        <button
                          className='btn btn-sm btn-primary'
                          onClick={() => ctx.showToast('Reading saved ✓')}
                        >
                          Save
                        </button>
                      </div>
                      <div className='flex gap-2 mt-3'>
                        <button
                          className='btn btn-sm btn-secondary'
                          onClick={() => ctx.showToast('Reminder snoozed')}
                        >
                          Snooze reminder
                        </button>
                        <button
                          className='btn btn-sm btn-ghost'
                          onClick={ctx.openCreate}
                        >
                          Edit meter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Things tab ── */}
        {tab === 'things' && (
          <div>
            {/* Group by category */}
            {Array.from(new Set(THINGS.map(t => t.category ?? 'Other'))).map(
              cat => {
                const catThings = THINGS.filter(
                  t => (t.category ?? 'Other') === cat,
                )
                return (
                  <div key={cat} className='mb-5'>
                    <div className='section-label mb-2'>{cat}</div>
                    <div
                      className='grid gap-3'
                      style={{
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(220px, 1fr))',
                      }}
                    >
                      {catThings.map(thing => {
                        const state = thingStates[thing.id] ?? thing.state
                        const stateColor = thingStateColor(state)
                        const isExpanded = expandedThing === thing.id

                        return (
                          <div key={thing.id} className='card overflow-hidden'>
                            <div className='p-4'>
                              <div className='flex items-start justify-between mb-3'>
                                <div style={{ fontSize: 28, lineHeight: 1 }}>
                                  {thing.icon}
                                </div>
                                {thing.type === 'toggle' ? (
                                  <button
                                    className='font-bold px-3 py-1'
                                    style={{
                                      background:
                                        stateColor === 'var(--sig-done)'
                                          ? 'var(--sig-done-bg)'
                                          : 'var(--surface-2)',
                                      color: stateColor,
                                      border: 'none',
                                      cursor: 'pointer',
                                      borderRadius: 'var(--r-full)',
                                      fontSize: 11,
                                      fontFamily: 'var(--font-ui)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                      transition: 'all 0.15s',
                                    }}
                                    onClick={() =>
                                      toggleThing(thing.id, state, thing.type)
                                    }
                                  >
                                    {state}
                                  </button>
                                ) : (
                                  <span
                                    className='badge'
                                    style={{
                                      background: `color-mix(in srgb, ${stateColor} 10%, transparent)`,
                                      color: stateColor,
                                      fontSize: 11,
                                    }}
                                  >
                                    {state}
                                  </span>
                                )}
                              </div>
                              <div
                                className='font-bold text-primary'
                                style={{ fontSize: 14 }}
                              >
                                {thing.name}
                              </div>
                              <div
                                className='text-faint mt-0.5'
                                style={{ fontSize: 11 }}
                              >
                                Changed {formatTimestamp(thing.lastChanged)}
                              </div>

                              <button
                                className='mt-2 flex items-center gap-1 text-faint'
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontFamily: 'var(--font-ui)',
                                  fontSize: 11,
                                }}
                                onClick={() =>
                                  setExpandedThing(isExpanded ? null : thing.id)
                                }
                              >
                                <FigmaIcon name='clock' size={11} />
                                History
                                <FigmaIcon
                                  name='chevron_down'
                                  size={11}
                                  style={{
                                    transform: isExpanded
                                      ? 'rotate(180deg)'
                                      : 'none',
                                    transition: 'transform 0.15s',
                                  }}
                                />
                              </button>
                            </div>

                            {isExpanded && (
                              <div
                                className='border-t px-4 py-3'
                                style={{ borderColor: 'var(--line)' }}
                              >
                                <div className='flex flex-col gap-1'>
                                  {thing.history.slice(0, 5).map((h, i) => (
                                    <div
                                      key={i}
                                      className='flex items-center justify-between'
                                    >
                                      <span
                                        className='text-muted'
                                        style={{ fontSize: 12 }}
                                      >
                                        {h.value}
                                      </span>
                                      <span
                                        className='text-faint'
                                        style={{ fontSize: 11 }}
                                      >
                                        {formatTimestamp(h.at)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className='flex gap-2 mt-3'>
                                  <button
                                    className='btn btn-sm btn-secondary'
                                    onClick={ctx.openCreate}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className='btn btn-sm btn-ghost'
                                    style={{ color: 'var(--sig-over)' }}
                                    onClick={() =>
                                      ctx.showToast(
                                        'Delete thing — confirm first',
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <button
                        className='card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer'
                        style={{
                          border: '2px dashed var(--line)',
                          minHeight: 120,
                          background: 'transparent',
                        }}
                        onClick={ctx.openCreate}
                      >
                        <FigmaIcon
                          name='plus'
                          size={20}
                          style={{ color: 'var(--brand)' }}
                        />
                        <span
                          className='font-semibold'
                          style={{ color: 'var(--brand)', fontSize: 12 }}
                        >
                          Add thing
                        </span>
                      </button>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Route wrapper ─────────────────────── */
const FigmaMaintenanceScreen = () => {
  const {
    closeConfirm,
    completeTask,
    confirmDialog,
    createTask,
    ctx,
    deleteTask,
    openEditTask,
    reopenTask,
    showCreateTask,
    taskDetail,
    taskToEdit,
    toasts,
    updateTask,
  } = usePe2Tasks()

  return (
    <>
      <MaintenanceScreen ctx={ctx} />
      {taskDetail && (
        <TaskDetailModal
          task={taskDetail}
          ctx={ctx}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={openEditTask}
          onReopen={reopenTask}
        />
      )}
      {showCreateTask && (
        <CreateTaskModal
          ctx={ctx}
          onCreated={(title, details) => createTask(title, details)}
        />
      )}
      {taskToEdit && (
        <CreateTaskModal
          ctx={ctx}
          taskToEdit={taskToEdit}
          onCreated={(title, details) =>
            updateTask(taskToEdit.id, title, details)
          }
        />
      )}
      {confirmDialog && (
        <ConfirmDialog config={confirmDialog} onClose={closeConfirm} />
      )}
      {toasts.length > 0 && <ToastContainer toasts={toasts} />}
    </>
  )
}

export default FigmaMaintenanceScreen
