import { Box, Typography } from '@mui/joy'
import { useState } from 'react'
import Calendar from 'react-calendar'

import { useLocalization } from '../../contexts/LocalizationContext'
import { getPriorityColor } from '../../utils/Colors'
import styles from './CalendarDual.module.css'

const CalendarDual = ({ chores, onDateChange }) => {
  const { firstDayOfWeek, fmt } = useLocalization()
  const calendarType =
    firstDayOfWeek === 1
      ? 'iso8601'
      : firstDayOfWeek === 6
        ? 'islamic'
        : 'gregory'

  const [selectedDate, setSeletedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const nextMonth = new Date(currentDate.getTime())
  nextMonth.setMonth(currentDate.getMonth() + 1)

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayChores = chores.filter(chore => {
        const choreDate = new Date(chore.nextDueDate).toLocaleDateString()
        const tileDate = date.toLocaleDateString()
        return choreDate === tileDate
      })
      if (dayChores.length === 0) {
        return (
          <div className={styles.dotContainer}>
            <span className={styles.dotEmpty}></span>
          </div>
        )
      }
      if (dayChores.length > 3) {
        return (
          <div className={styles.dotContainer}>
            <span
              className={styles.dotWithLine}
              style={{
                backgroundColor: getPriorityColor(dayChores[0].priority),
              }}
            ></span>
          </div>
        )
      }

      return (
        <div className={styles.dotContainer}>
          {dayChores.map((chore, index) => {
            return (
              <span
                key={index}
                className={styles.dot}
                style={{
                  backgroundColor: getPriorityColor(chore.priority),
                }}
              ></span>
            )
          })}
        </div>
      )
    }
    return null
  }

  const renderSingleCalendar = (date, isSecondary = false) => (
    <div
      className={`${styles.reactCalendar} ${isSecondary ? styles.secondaryCalendar : ''}`}
    >
      {isSecondary && (
        <div className={styles.secondaryCalendarHeader}>
          <Typography level='title-md' sx={{ textAlign: 'center', mb: 1 }}>
            {fmt.date(date, 'MMMM YYYY')}
          </Typography>
        </div>
      )}
      <Calendar
        className={styles.reactCalendar}
        tileContent={tileContent}
        calendarType={calendarType}
        onChange={d => {
          let date = new Date(d)
          setSeletedDate(date)
          onDateChange(date)
        }}
        value={selectedDate}
        activeStartDate={date}
        // Don't show navigation on secondary calendar
        showNavigation={!isSecondary}
        formatShortWeekday={(locale, date) =>
          new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date)
        }
        onActiveStartDateChange={({ activeStartDate }) => {
          if (!isSecondary) {
            setCurrentDate(activeStartDate)
          }
        }}
      />
    </div>
  )

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Responsive Calendar Layout */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 4 },
          justifyContent: 'center',
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        {/* Primary Calendar */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {renderSingleCalendar(currentDate)}
        </Box>

        {/* Secondary Calendar - only show on desktop */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
          }}
        >
          {renderSingleCalendar(nextMonth, true)}
        </Box>
      </Box>
    </div>
  )
}

export default CalendarDual
