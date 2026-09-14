import {
  EventBusy,
  EventNote,
  HourglassEmpty,
  PriorityHigh,
  TrendingUp,
  WatchLater,
} from '@mui/icons-material'
import { Box, Button, Chip, Typography } from '@mui/joy'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import SectionCard from '../../components/common/SectionCard'
import { sideCardSx } from './sideCardSx'

const SmartInsightsCard = ({
  applyTempFilter,
  chores,
  clearTempFilter,
  tempFilter,
}) => {
  const { t } = useTranslation('chores')
  // Detect all possible insights from chores
  const insights = useMemo(() => {
    if (!chores || chores.length === 0) return []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const detectedInsights = []

    // 1. Overdue tasks (Highest Priority)
    const overdueTasks = chores.filter(
      chore => chore.nextDueDate && new Date(chore.nextDueDate) < now,
    )
    if (overdueTasks.length > 0) {
      detectedInsights.push({
        id: 'overdue',
        priority: 1,
        count: overdueTasks.length,
        title: t('sideCards.overdue'),
        description: t('sideCards.overdueDescription', {
          count: overdueTasks.length,
        }),
        color: 'danger',
        icon: <WatchLater />,
        filter: {
          conditions: [
            {
              type: 'dueDate',
              operator: 'isOverdue',
              value: null,
            },
          ],
          operator: 'AND',
        },
      })
    }

    // 2. Due today (High Priority)
    const dueTodayTasks = chores.filter(
      chore =>
        chore.nextDueDate &&
        new Date(chore.nextDueDate).toDateString() === today.toDateString(),
    )
    if (dueTodayTasks.length > 0) {
      detectedInsights.push({
        id: 'due-today',
        priority: 2,
        count: dueTodayTasks.length,
        title: t('sideCards.dueToday'),
        description: t('sideCards.dueTodayDescription', {
          count: dueTodayTasks.length,
        }),
        color: 'warning',
        icon: <EventNote />,
        filter: {
          conditions: [
            {
              type: 'dueDate',
              operator: 'isDueToday',
              value: null,
            },
          ],
          operator: 'AND',
        },
      })
    }

    // 3. Pending approval (High Priority)
    const pendingApprovalTasks = chores.filter(chore => chore.status === 3)
    if (pendingApprovalTasks.length > 0) {
      detectedInsights.push({
        id: 'pending-approval',
        priority: 3,
        count: pendingApprovalTasks.length,
        title: t('sideCards.pendingApproval'),
        description: t('sideCards.pendingApprovalDescription', {
          count: pendingApprovalTasks.length,
        }),
        color: 'neutral',
        icon: <HourglassEmpty />,
        filter: {
          conditions: [
            {
              type: 'status',
              operator: 'is',
              value: 3,
            },
          ],
          operator: 'AND',
        },
      })
    }

    // 4. Due this week (excluding today) (Medium Priority)
    const dueThisWeekTasks = chores.filter(chore => {
      if (!chore.nextDueDate) return false
      const dueDate = new Date(chore.nextDueDate)
      return dueDate >= tomorrow && dueDate < nextWeek
    })
    if (dueThisWeekTasks.length > 0) {
      detectedInsights.push({
        id: 'due-this-week',
        priority: 4,
        count: dueThisWeekTasks.length,
        title: t('sideCards.dueThisWeek'),
        description: t('sideCards.dueThisWeekDescription', {
          count: dueThisWeekTasks.length,
        }),
        color: 'primary',
        icon: <TrendingUp />,
        filter: {
          conditions: [
            {
              type: 'dueDate',
              operator: 'isDueThisWeek',
              value: null,
            },
          ],
          operator: 'AND',
        },
      })
    }

    // 5. High priority tasks (Medium Priority)
    const highPriorityTasks = chores.filter(
      chore => chore.priority === 1 || chore.priority === 2,
    )
    if (highPriorityTasks.length > 0) {
      detectedInsights.push({
        id: 'high-priority',
        priority: 5,
        count: highPriorityTasks.length,
        title: t('sideCards.highPriority'),
        description: t('sideCards.highPriorityDescription', {
          count: highPriorityTasks.length,
        }),
        color: 'warning',
        icon: <PriorityHigh />,
        filter: {
          conditions: [
            {
              type: 'priority',
              operator: 'is',
              value: [1, 2],
            },
          ],
          operator: 'AND',
        },
      })
    }

    // 6. No due date (Lower Priority)
    const noDueDateTasks = chores.filter(
      chore => !chore.nextDueDate || chore.nextDueDate === null,
    )
    if (noDueDateTasks.length > 0) {
      detectedInsights.push({
        id: 'no-due-date',
        priority: 6,
        count: noDueDateTasks.length,
        title: t('sideCards.noDueDate'),
        description: t('sideCards.noDueDateDescription', {
          count: noDueDateTasks.length,
        }),
        color: 'neutral',
        icon: <EventBusy />,
        filter: {
          conditions: [
            {
              type: 'dueDate',
              operator: 'hasNoDueDate',
              value: null,
            },
          ],
          operator: 'AND',
        },
      })
    }

    // Sort by priority and return top 3
    return detectedInsights.sort((a, b) => a.priority - b.priority).slice(0, 3)
  }, [chores, t])

  const handleInsightClick = insight => {
    // Toggle: if already active, clear it; otherwise apply it
    if (isInsightActive(insight)) {
      clearTempFilter()
    } else {
      applyTempFilter(insight.filter, {
        id: insight.id,
        name: insight.title,
        description: insight.description,
        icon: insight.icon,
        color: insight.color,
      })
    }
  }

  const isInsightActive = insight => {
    if (!tempFilter || !tempFilter.conditions) return false
    return (
      JSON.stringify(tempFilter.conditions) ===
      JSON.stringify(insight.filter.conditions)
    )
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <SectionCard sx={sideCardSx}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color='' />
            <Typography level='title-md'>
              {t('sideCards.smartInsights')}
            </Typography>
          </Box>
          {tempFilter && (
            <Chip size='sm' variant='solid' color='primary'>
              {t('sideCards.active')}
            </Chip>
          )}
        </Box>
        <Typography level='body-xs' sx={{ mt: 0.5, color: 'text.secondary' }}>
          {tempFilter
            ? t('sideCards.clearActive')
            : t('sideCards.quickActions')}
        </Typography>
      </Box>

      {/* Insight Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {insights.map(insight => {
          const isActive = isInsightActive(insight)
          return (
            <Button
              key={insight.id}
              variant={isActive ? 'outlined' : 'soft'}
              color='neutral'
              onClick={() => handleInsightClick(insight)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                p: 1.5,
                height: 'auto',
                borderRadius: 'var(--r-sm)',
                transition: 'all 0.2s ease',
                border: isActive ? '2px solid' : '2px solid transparent',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {insight.icon}
                  <Typography level='title-sm' sx={{ fontWeight: 600 }}>
                    {insight.title}
                  </Typography>
                </Box>
                <Chip
                  size='sm'
                  variant='solid'
                  color={insight.color}
                  sx={{
                    minWidth: 32,
                    fontWeight: 700,
                  }}
                >
                  {insight.count}
                </Chip>
              </Box>
              <Typography
                level='body-xs'
                sx={{
                  textAlign: 'start',
                  opacity: 0.9,
                }}
              >
                {isActive ? `✓ ${insight.description}` : insight.description}
              </Typography>
            </Button>
          )
        })}
      </Box>
    </SectionCard>
  )
}

export default SmartInsightsCard
