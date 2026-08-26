import { Box } from '@mui/joy'
import { useMediaQuery } from '@mui/material'
import { useEffect, useState } from 'react'

import SectionCard from '../../components/common/SectionCard'
import { useChoresHistory } from '../../queries/ChoreQueries'
import { ChoresGrouper } from '../../utils/Chores'
import { getSidepanelConfig } from '../../utils/SidepanelConfig'
import CalendarCard from '../components/CalendarCard'
import ActivitiesCard from './ActivitesCard'
import { sideCardSx } from './sideCardSx'
import SmartInsightsCard from './SmartInsightsCard'
import TasksByAssigneeCard from './TasksByAssigneeCard'
import UserSwitcher from './UserSwitcher'

const Sidepanel = ({
  allChores,
  applyTempFilter,
  chores,
  clearTempFilter,
  tempFilter,
}) => {
  const isLargeScreen = useMediaQuery(theme => theme.breakpoints.up('lg'))
  const [dueDatePieChartData, setDueDatePieChartData] = useState([])
  const [sidepanelConfig, setSidepanelConfig] = useState([])
  const {
    data: choresHistory,
    handleLimitChange: refetchHistory,
    isChoresHistoryLoading,
  } = useChoresHistory(7, true)

  useEffect(() => {
    setDueDatePieChartData(generateChoreDuePieChartData(chores))
    setSidepanelConfig(getSidepanelConfig())
  }, [])

  useEffect(() => {
    const handleConfigChange = () => {
      setSidepanelConfig(getSidepanelConfig())
    }

    window.addEventListener('sidepanelConfigChanged', handleConfigChange)
    return () => {
      window.removeEventListener('sidepanelConfigChanged', handleConfigChange)
    }
  }, [])

  const generateChoreDuePieChartData = chores => {
    const groups = ChoresGrouper('due_date', chores, null)
    return groups
      .map(group => {
        return {
          label: group.name,
          value: group.content.length,
          color: group.color,
          id: group.name,
        }
      })
      .filter(item => item.value > 0)
  }

  const renderCard = cardConfig => {
    if (!cardConfig.enabled) return null

    switch (cardConfig.id) {
      case 'welcome':
        return <UserSwitcher key='welcome' chores={chores} />
      case 'smartInsights':
        return (
          <SmartInsightsCard
            key='smartInsights'
            chores={allChores || chores}
            applyTempFilter={applyTempFilter}
            clearTempFilter={clearTempFilter}
            tempFilter={tempFilter}
          />
        )
      case 'assignees':
        return <TasksByAssigneeCard key='assignees' chores={chores} />
      case 'calendar':
        return (
          <SectionCard
            key='calendar'
            sx={{
              ...sideCardSx,
              my: 1,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box
              sx={{ width: '100%', overflowY: 'hidden', overflowX: 'hidden' }}
            >
              <CalendarCard chores={chores} />
            </Box>
          </SectionCard>
        )
      case 'activities':
        return (
          <ActivitiesCard
            key='activities'
            chores={chores}
            choreHistory={choresHistory}
          />
        )

      default:
        return null
    }
  }

  if (!isLargeScreen) {
    return null
  }

  const sortedCards = [...sidepanelConfig].sort((a, b) => a.order - b.order)

  return (
    <Box sx={{ minWidth: 0 }}>
      {sortedCards.map(cardConfig => renderCard(cardConfig))}
    </Box>
  )
}

export default Sidepanel
