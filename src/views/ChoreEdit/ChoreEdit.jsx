import {
  Add,
  ArrowDropDown,
  AttachFile,
  Delete,
  DocumentScanner,
  HorizontalRule,
  Save,
  UploadFile,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Chip,
  Container,
  Divider,
  Dropdown,
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  List,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  Option,
  Radio,
  RadioGroup,
  Select,
  Sheet,
  Stack,
  Typography,
} from '@mui/joy'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import ChoreQueryStateView from '../../components/chores/ChoreQueryStateView.jsx'
import DurationInput from '../../components/common/DurationInput'
import KeyboardShortcutHint from '../../components/common/KeyboardShortcutHint'
import NotificationTemplate from '../../components/NotificationTemplate.jsx'
import { useDocumentScanner } from '../../hooks/useDocumentScanner'
import {
  useArchiveChore,
  useChore,
  useCreateChore,
  useDeleteChores,
  useUnArchiveChore,
  useUpdateChore,
} from '../../queries/ChoreQueries.jsx'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries.jsx'
import { useNotification } from '../../service/NotificationProvider'
import { settingsPageSx } from '../../theme/appLayout'
import {
  DEFAULT_PROJECT_COLOR,
  getTextColorFromBackgroundColor,
} from '../../utils/Colors'
import {
  DeleteChoreAttachment,
  DeleteDraftAttachment,
  GetAllCircleMembers,
  GetMeters,
  GetThings,
  UploadChoreAttachment,
} from '../../utils/Fetcher'
import { imageSourceToFile } from '../../utils/FileConvert'
import { isPlusAccount, resolvePhotoURL } from '../../utils/Helpers'
import { getImageSrc, removeCachedImage } from '../../utils/ImageCache'
import Priorities from '../../utils/Priorities.jsx'
import { getIconComponent } from '../../utils/ProjectIcons'
import { getSafeBottomPadding } from '../../utils/SafeAreaUtils.js'
import { generateUUID } from '../../utils/UUID'
import { useProjectFilter } from '../Chores/hooks/useProjectFilter.js'
import CategoryPickerField from '../components/CategoryPickerField.jsx'
import LoadingComponent from '../components/Loading.jsx'
import RichTextEditor from '../components/RichTextEditor.jsx'
import SubTasks from '../components/SubTask.jsx'
import { useLabels } from '../Labels/LabelQueries'
import AttachmentViewerModal from '../Modals/Inputs/AttachmentViewerModal'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import LabelModal from '../Modals/Inputs/LabelModal'
import { useProjects } from '../Projects/ProjectQueries'
import RepeatSection from './RepeatSection'

const ASSIGN_STRATEGIES = [
  'random',
  'least_assigned',
  'least_completed',
  'keep_last_assigned',
  'random_except_last_assigned',
  'round_robin',
  'no_assignee',
]
const DEFAULT_ASSIGN_STRATEGY = ASSIGN_STRATEGIES[3] // keep_last_assigned
const REPEAT_ON_TYPE = ['interval', 'days_of_the_week', 'day_of_the_month']

const NO_DUE_DATE_REQUIRED_TYPE = ['no_repeat', 'once']
const NO_DUE_DATE_ALLOWED_TYPE = ['trigger']
const ChoreEdit = () => {
  const { t } = useTranslation('common')
  const { data: userProfile, isLoading: isUserProfileLoading } =
    useUserProfile()

  const [chore, setChore] = useState([])
  const { choreId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [confirmModelConfig, setConfirmModelConfig] = useState({})
  const [anyone, setAnyone] = useState(false)
  const [assignableTo, setAssignableTo] = useState([])
  const [performers, setPerformers] = useState([])
  const [assignStrategy, setAssignStrategy] = useState(DEFAULT_ASSIGN_STRATEGY)
  const [dueDate, setDueDate] = useState(null)
  const [originalDueDate, setOriginalDueDate] = useState(null)
  const [dueDateDirty, setDueDateDirty] = useState(false)
  const [dueDateOnly, setDueDateOnly] = useState(null)
  const [dueTime, setDueTime] = useState(null)
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [assignedTo, setAssignedTo] = useState(-1)
  const [frequencyType, setFrequencyType] = useState('once')
  const [frequency, setFrequency] = useState(1)
  const [frequencyMetadata, setFrequencyMetadata] = useState({})
  const [labels, setLabels] = useState([])
  const [labelsV2, setLabelsV2] = useState([])
  const [categoryId, setCategoryId] = useState(null)
  const [priority, setPriority] = useState(0)
  const [points, setPoints] = useState(-1)
  const [requireApproval, setRequireApproval] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [subTasks, setSubTasks] = useState(null)
  const [completionWindow, setCompletionWindow] = useState(-1)
  const [deadlineOffset, setDeadlineOffset] = useState(-1)
  const [allUserThings, setAllUserThings] = useState([])
  const [thingTrigger, setThingTrigger] = useState(null)
  const [meters, setMeters] = useState([])
  const [meterSchedule, setMeterSchedule] = useState(null)
  const [isThingValid, setIsThingValid] = useState(false)

  const [notificationMetadata, setNotificationMetadata] = useState({})

  const [isRolling, setIsRolling] = useState(false)
  const [isNotificable, setIsNotificable] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [updatedBy, setUpdatedBy] = useState(0)
  const [createdBy, setCreatedBy] = useState(0)
  const [errors, setErrors] = useState({})
  const [attemptToSave, setAttemptToSave] = useState(false)
  const [draftId] = useState(() => generateUUID())
  const [attachments, setAttachments] = useState([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [addLabelModalOpen, setAddLabelModalOpen] = useState(false)
  const [attachmentViewerConfig, setAttachmentViewerConfig] = useState({
    isOpen: false,
  })
  const [showSavePrivacyDefault, setShowSavePrivacyDefault] = useState(false)
  const [showSaveAssigneeDefault, setShowSaveAssigneeDefault] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  const { data: userLabelsRaw, isLoading: isUserLabelsLoading } = useLabels()
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects()

  const { projectsWithDefault, selectedProject, setSelectedProjectWithCache } =
    useProjectFilter(projects)

  const [projectId, setProjectId] = useState(
    selectedProject ? selectedProject.id : 'default',
  )

  const updateChoreMutation = useUpdateChore()
  const createChoreMutation = useCreateChore()
  const saveInFlightRef = useRef(false)
  const archiveChore = useArchiveChore()
  const unarchiveChore = useUnArchiveChore()
  const deleteChores = useDeleteChores()
  const {
    data: choreData,
    error: choreError,
    isError: isChoreError,
    isLoading: isChoreLoading,
    refetch: refetchChore,
  } = useChore(choreId)
  const { data: membersData, isLoading: isMemberDataLoading } =
    useCircleMembers()
  const { showError, showSuccess } = useNotification()
  const { isNativeScanner, scanDocument } = useDocumentScanner()

  const [userLabels, setUserLabels] = useState([])

  useEffect(() => {
    if (userLabelsRaw) {
      setUserLabels(userLabelsRaw)
    }
  }, [userLabelsRaw])

  const Navigate = useNavigate()

  const assignees = anyone ? performers : assignableTo
  const hasSpecificAssignees = !anyone && assignableTo.length > 0
  const canPickStrategy = hasSpecificAssignees && assignableTo.length > 1
  const assignStrategyValue = !hasSpecificAssignees
    ? 'no_assignee'
    : canPickStrategy
      ? assignStrategy
      : DEFAULT_ASSIGN_STRATEGY
  const assignedToValue =
    !hasSpecificAssignees || assignStrategyValue === 'no_assignee'
      ? null
      : assignableTo.some(a => a.userId === assignedTo)
        ? assignedTo
        : assignableTo[0].userId

  const HandleValidateChore = () => {
    const errors = {}

    if (name.trim() === '') {
      errors.name = t('choreEdit.validationNameRequired')
    }
    if (frequencyType === 'interval' && !frequency > 0) {
      errors.frequency = t('choreEdit.validationFrequencyInvalid', {
        unit: frequencyMetadata.unit,
      })
    }
    if (
      frequencyType === 'days_of_the_week' &&
      frequencyMetadata['days']?.length === 0
    ) {
      errors.frequency = t('choreEdit.validationSelectDay')
    }

    // Validate advanced scheduling patterns
    if (
      frequencyType === 'days_of_the_week' &&
      frequencyMetadata?.weekPattern === 'week_of_month' &&
      (!frequencyMetadata?.occurrences ||
        frequencyMetadata.occurrences.length === 0)
    ) {
      errors.frequency = t('choreEdit.validationSelectDayOccurrence')
    }
    if (
      frequencyType === 'day_of_the_month' &&
      frequencyMetadata['months']?.length === 0
    ) {
      errors.frequency = t('choreEdit.validationSelectMonth')
    }
    if (
      dueDate === null &&
      !NO_DUE_DATE_REQUIRED_TYPE.includes(frequencyType) &&
      !NO_DUE_DATE_ALLOWED_TYPE.includes(frequencyType)
    ) {
      if (REPEAT_ON_TYPE.includes(frequencyType)) {
        errors.dueDate = t('choreEdit.validationStartDateRequired')
      } else {
        errors.dueDate = t('choreEdit.validationDueDateRequired')
      }
    }
    if (frequencyType === 'trigger') {
      if (!isThingValid) {
        errors.thingTrigger = t('choreEdit.validationThingTriggerInvalid')
      }
    }
    if (
      meterSchedule &&
      (!meterSchedule.meterId || Number(meterSchedule.interval) <= 0)
    ) {
      errors.meterSchedule = t('choreEdit.validationMeterScheduleInvalid')
    }

    // if there is any error then return false:
    setErrors(errors)
    if (Object.keys(errors).length > 0) {
      // generate a list with error and set it in snackbar:

      const errorList = Object.keys(errors).map(key => (
        <ListItem key={key}>{errors[key]}</ListItem>
      ))
      showError({
        title: t('choreEdit.validationErrors'),
        message: <List>{errorList}</List>,
      })
      return false
    }

    return true
  }

  const handleDueDateChange = e => {
    setDueDateDirty(true)
    const dateValue = e.target.value // YYYY-MM-DD format
    setDueDateOnly(dateValue)

    // Combine date with time or end of day
    if (useCustomTime && dueTime) {
      // Use the custom time
      const combinedDateTime = moment(`${dateValue}T${dueTime}`).format(
        'YYYY-MM-DDTHH:mm:00',
      )
      setDueDate(combinedDateTime)

      // Update frequencyMetadata.time for REPEAT_ON_TYPE frequencies
      if (REPEAT_ON_TYPE.includes(frequencyType)) {
        setFrequencyMetadata({
          ...frequencyMetadata,
          time: moment(`${dateValue}T${dueTime}`).format(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      }
    } else {
      // Default to end of day (23:59:59) in user's timezone
      const endOfDay = moment(dateValue)
        .endOf('day')
        .format('YYYY-MM-DDTHH:mm:59')
      setDueDate(endOfDay)
    }
  }

  const handleDueTimeChange = e => {
    setDueDateDirty(true)
    const timeValue = e.target.value // HH:mm format
    setDueTime(timeValue)

    if (dueDateOnly) {
      // Combine date with the selected time
      const combinedDateTime = moment(`${dueDateOnly}T${timeValue}`).format(
        'YYYY-MM-DDTHH:mm:00',
      )
      setDueDate(combinedDateTime)

      // Update frequencyMetadata.time for REPEAT_ON_TYPE frequencies
      if (REPEAT_ON_TYPE.includes(frequencyType)) {
        setFrequencyMetadata({
          ...frequencyMetadata,
          time: moment(`${dueDateOnly}T${timeValue}`).format(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      }
    }
  }

  const handleUseCustomTimeChange = checked => {
    setDueDateDirty(true)
    setUseCustomTime(checked)

    if (checked) {
      // Initialize with current time or default to 18:00
      const defaultTime = dueTime || '18:00'
      setDueTime(defaultTime)

      if (dueDateOnly) {
        const combinedDateTime = moment(`${dueDateOnly}T${defaultTime}`).format(
          'YYYY-MM-DDTHH:mm:59',
        )
        setDueDate(combinedDateTime)

        // Update frequencyMetadata.time for REPEAT_ON_TYPE frequencies
        if (REPEAT_ON_TYPE.includes(frequencyType)) {
          setFrequencyMetadata({
            ...frequencyMetadata,
            time: moment(`${dueDateOnly}T${defaultTime}`).format(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
        }
      }
    } else {
      // Revert to end of day
      if (dueDateOnly) {
        const endOfDay = moment(dueDateOnly)
          .endOf('day')
          .format('YYYY-MM-DDTHH:mm:ss')
        setDueDate(endOfDay)
      }
    }
  }
  const HandleSaveChore = () => {
    if (saveInFlightRef.current) return
    setAttemptToSave(true)
    if (!HandleValidateChore()) {
      return
    }
    saveInFlightRef.current = true
    let newChoreId = choreId
    if (searchParams.get('clone') === 'true') {
      newChoreId = null
    }
    const assignees = anyone ? [] : assignableTo
    const chore = {
      id: Number(newChoreId),
      name: name,
      description: description,
      assignees: assignees,
      dueDate: dueDateDirty
        ? dueDate
          ? new Date(dueDate).toISOString()
          : null
        : originalDueDate,
      nextDueDate: dueDateDirty
        ? dueDate
          ? new Date(dueDate).toISOString()
          : null
        : originalDueDate,
      frequencyType: frequencyType,
      frequency: Number(frequency),
      frequencyMetadata: frequencyMetadata,
      assignedTo: assignedToValue,
      assignStrategy: assignStrategyValue,
      isRolling: isRolling,
      isActive: isActive,
      notification: isNotificable,
      labels: labels.map(l => l.name),
      labelsV2: labelsV2,
      categoryId,
      subTasks: subTasks,
      notificationMetadata: notificationMetadata,
      thingTrigger: thingTrigger,
      meterSchedule: meterSchedule
        ? {
            meterId: Number(meterSchedule.meterId),
            interval: Number(meterSchedule.interval),
            warnBefore: Number(meterSchedule.warnBefore || 0),
          }
        : null,
      points: points < 0 ? null : points,
      requireApproval: requireApproval,
      isPrivate: isPrivate,
      completionWindow:
        // if completionWindow is -1 then set it to null or dueDate is null
        completionWindow < 0 || dueDate === null ? null : completionWindow,
      deadlineOffset: deadlineOffset < 0 ? null : deadlineOffset,
      priority: priority,
      projectId: projectId === 'default' ? null : projectId,
      draftId: newChoreId > 0 ? undefined : draftId,
    }
    let SaveFunction = createChoreMutation.mutateAsync
    if (newChoreId > 0) {
      SaveFunction = updateChoreMutation.mutateAsync
    }

    SaveFunction(chore)
      .then(result => {
        if (
          result?._pendingUpdate ||
          result?._pendingCreate ||
          result?.res?._pendingCreate
        ) {
          showSuccess({
            title: t('choreEdit.savedOfflineTitle'),
            message: t('choreEdit.savedOfflineMessage'),
          })
        } else {
          showSuccess({
            title: t('choreEdit.choreSavedTitle'),
            message: t('choreEdit.choreSavedMessage'),
          })
        }
        Navigate('/chores')
      })
      .catch(error => {
        console.error('Failed to save chore:', error)
        showError({
          title: t('choreEdit.saveFailedTitle'),
          message: error?.isServerMessage
            ? error.message
            : t('choreEdit.saveFailedMessage'),
        })
      })
      .finally(() => {
        saveInFlightRef.current = false
      })
  }
  useEffect(() => {
    //fetch performers:
    GetAllCircleMembers().then(data => {
      setPerformers(data.res)
    })
    GetThings().then(response => {
      response.json().then(data => {
        setAllUserThings(data.res)
      })
    })
    GetMeters()
      .then(response => response.json())
      .then(data => setMeters(data.res || []))

    // Load default privacy setting for new chores
    if (!choreId) {
      const defaultPrivacySetting = localStorage.getItem(
        'defaultPrivacySetting',
      )
      if (defaultPrivacySetting !== null) {
        setIsPrivate(JSON.parse(defaultPrivacySetting))
      }

      const defaultNotificationSetting = localStorage.getItem(
        'defaultNotificationSetting',
      )
      if (defaultNotificationSetting !== null) {
        setIsNotificable(JSON.parse(defaultNotificationSetting))
      }

      const defaultAnyoneSetting = localStorage.getItem('defaultAnyoneSetting')
      if (defaultAnyoneSetting != null) {
        const savedAnyone = JSON.parse(defaultAnyoneSetting)
        setAnyone(savedAnyone)
      }

      const defaultAssigneeSetting = localStorage.getItem(
        'defaultAssigneeSetting',
      )
      if (defaultAssigneeSetting !== null) {
        const savedAssignees = JSON.parse(defaultAssigneeSetting)
        setAssignableTo(savedAssignees)
      }
    }
  }, [])
  useEffect(() => {
    if (choreId || !userProfile?.id) return

    const defaultAnyoneSetting = localStorage.getItem('defaultAnyoneSetting')
    const defaultAssigneeSetting = localStorage.getItem(
      'defaultAssigneeSetting',
    )

    if (defaultAnyoneSetting === null && defaultAssigneeSetting === null) {
      setAnyone(false)
      setAssignableTo([{ userId: userProfile.id }])
      setAssignedTo(userProfile.id)
    }
  }, [choreId, userProfile?.id])
  useEffect(() => {
    const anyoneSetting = localStorage.getItem('defaultAnyoneSetting')
    const anyoneDirty = anyoneSetting !== JSON.stringify(anyone)
    const assigneeSetting = localStorage.getItem('defaultAssigneeSetting')
    const assigneeDirty = assigneeSetting !== JSON.stringify(assignableTo)
    const dirty = anyoneDirty || (!anyone && assigneeDirty)
    setShowSaveAssigneeDefault(dirty)
  }, [anyone, assignableTo])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = event => {
      const isHoldingCmd = event.ctrlKey || event.metaKey

      // Show keyboard shortcuts when holding Cmd/Ctrl
      if (isHoldingCmd) {
        setShowKeyboardShortcuts(true)
      }

      // Cmd/Ctrl + Enter to save
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        HandleSaveChore()
        return
      }

      // Cmd/Ctrl + Escape key to cancel
      if (event.key === 'Escape' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        window.history.back()
        return
      }
    }

    const handleKeyUp = event => {
      if (event.key === 'Control' || event.key === 'Meta') {
        setShowKeyboardShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [HandleSaveChore])

  useEffect(() => {
    if (isChoreLoading === false && choreData && choreId) {
      const data = choreData
      const isCloneMode = searchParams.get('clone') === 'true'

      setChore(data.res)
      setName(data.res.name ? data.res.name : '')
      setDescription(data.res.description ? data.res.description : '')
      setAssignableTo(data.res.assignees ? data.res.assignees : [])
      setAnyone((data.res.assignees?.length || 0) === 0)
      setAssignedTo(data.res.assignedTo)
      setFrequencyType(data.res.frequencyType ? data.res.frequencyType : 'once')

      setFrequencyMetadata(data.res.frequencyMetadata)
      setFrequency(data.res.frequency)

      setNotificationMetadata(data.res.notificationMetadata)
      setPoints(data.res.points && data.res.points > -1 ? data.res.points : -1)
      setRequireApproval(data.res.requireApproval || false)
      setIsPrivate(data.res.isPrivate || false)
      setCompletionWindow(
        data.res.completionWindow && data.res.completionWindow > -1
          ? data.res.completionWindow
          : -1,
      )
      setDeadlineOffset(
        data.res.deadlineOffset && data.res.deadlineOffset > -1
          ? data.res.deadlineOffset
          : -1,
      )

      setLabelsV2(data.res.labelsV2)
      setCategoryId(data.res.categoryId || null)

      setPriority(data.res.priority)
      setAssignStrategy(
        data.res.assignStrategy
          ? data.res.assignStrategy
          : DEFAULT_ASSIGN_STRATEGY,
      )
      setIsRolling(data.res.isRolling)
      setIsActive(data.res.isActive)
      setSubTasks(data.res.subTasks ? data.res.subTasks : [])
      setProjectId(data.res.projectId || 'default')

      if (isCloneMode) {
        if (data.res.subTasks) {
          const clonedSubTasks = data.res.subTasks.map(subTask => ({
            ...subTask,
            id: -subTask.id, // Negate ID to indicate new sub task
            parentId: subTask.parentId ? -subTask.parentId : null, // Negate parent ID if exists
            completed: false, // Reset completion status
            completedAt: null, // Reset completion date
          }))
          setSubTasks(clonedSubTasks)
        }
        if (data.res.name) {
          setName(`Copy of ${data.res.name}`)
        }
      }

      setIsNotificable(data.res.notification)
      setThingTrigger(data.res.thingChore)
      setMeterSchedule(
        data.res.meterSchedule
          ? {
              meterId: data.res.meterSchedule.meterId,
              interval: data.res.meterSchedule.interval,
              warnBefore: data.res.meterSchedule.warnBefore || 0,
            }
          : null,
      )

      // Parse existing due date into date and time components
      if (data.res.nextDueDate) {
        setOriginalDueDate(data.res.nextDueDate)
        setDueDateDirty(false)
        const dueDateMoment = moment(data.res.nextDueDate)
        const dateOnly = dueDateMoment.format('YYYY-MM-DD')
        const timeOnly = dueDateMoment.format('HH:mm')
        const endOfDayTime = '23:59'

        setDueDateOnly(dateOnly)
        setDueDate(dueDateMoment.format('YYYY-MM-DDTHH:mm:00'))

        // Check if it's a custom time (not end of day)
        if (timeOnly !== endOfDayTime) {
          setUseCustomTime(true)
          setDueTime(timeOnly)
        } else {
          setUseCustomTime(false)
          setDueTime(null)
        }
      } else {
        setOriginalDueDate(null)
        setDueDateDirty(false)
        setDueDateOnly(null)
        setDueDate(null)
        setUseCustomTime(false)
        setDueTime(null)
      }

      setCreatedBy(data.res.createdBy)
      setUpdatedBy(data.res.updatedBy)
      setAttachments(data.res.attachments || [])
    }
  }, [choreData, isChoreLoading, searchParams])

  // useEffect(() => {
  //   if (userLabels && userLabels.length == 0 && labelsV2.length == 0) {
  //     return
  //   }
  //   const labelIds = labelsV2.map(l => l.id)
  //   setLabelsV2(userLabels.filter(l => labelIds.indexOf(l.id) > -1))
  // }, [userLabels, labelsV2])

  useEffect(() => {
    // if frequency type change to something need a due date then set it to the current date:
    if (!NO_DUE_DATE_REQUIRED_TYPE.includes(frequencyType) && !dueDate) {
      setDueDateDirty(true)
      const today = moment(new Date()).format('YYYY-MM-DD')
      setDueDateOnly(today)
      // Default to end of day
      setDueDate(moment(today).endOf('day').format('YYYY-MM-DDTHH:mm:59'))
      setUseCustomTime(false)
      setDueTime(null)
    }
    if (NO_DUE_DATE_ALLOWED_TYPE.includes(frequencyType)) {
      setDueDateDirty(true)
      setDueDate(null)
      setDueDateOnly(null)
      setUseCustomTime(false)
      setDueTime(null)
    }
  }, [frequencyType])

  // useEffect(() => {
  //   if (performers.length > 0 && assignees.length === 0 && userProfile) {
  //     setAssignees([
  //       {
  //         userId: userProfile?.id,
  //       },
  //     ])
  //   }
  // }, [performers, userProfile])

  // if user resolve the error trigger validation to remove the error message from the respective field
  useEffect(() => {
    if (attemptToSave) {
      HandleValidateChore()
    }
  }, [assignableTo, name, frequencyMetadata, attemptToSave, dueDate])

  const uploadAttachmentFile = async file => {
    if (!file) return
    setIsUploadingAttachment(true)
    try {
      const response = choreId
        ? await UploadChoreAttachment(file, 'chore_attachment', {
            entityId: choreId,
          })
        : await UploadChoreAttachment(file, 'chore_attachment_draft', {
            draftId,
          })
      if (!response.ok) {
        showError({
          title: t('choreEdit.uploadFailedTitle'),
          message: t('choreEdit.uploadFailedMessage'),
        })
        return
      }
      const data = await response.json()
      setAttachments(prev => [
        ...prev,
        {
          file_path: data.path,
          file_name: data.file_name,
          size_bytes: data.size_bytes,
          sign: data.sign,
        },
      ])
    } catch {
      showError({
        title: t('choreEdit.uploadFailedTitle'),
        message: t('choreEdit.uploadFailedMessage'),
      })
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  // Native only: the OS scanner returns a cropped, deskewed page which is a
  // better attachment than a raw camera shot of the same document.
  const handleScanAttachment = async () => {
    const { cancelled, error, image } = await scanDocument()
    if (cancelled) return
    if (error || !image) {
      showError({
        title: t('choreEdit.scanFailedTitle'),
        message: error || t('choreEdit.scanFailedMessage'),
      })
      return
    }
    const file = await imageSourceToFile(image, `scan-${Date.now()}.jpg`)
    if (!file) {
      showError({
        title: t('choreEdit.scanFailedTitle'),
        message: t('choreEdit.scanReadFailedMessage'),
      })
      return
    }
    await uploadAttachmentFile(file)
  }

  const handleDelete = () => {
    setConfirmModelConfig({
      isOpen: true,
      title: t('choreEdit.deleteChoreTitle'),
      confirmText: t('choreEdit.deleteChoreConfirm'),
      cancelText: t('choreEdit.deleteChoreCancel'),
      message: t('choreEdit.deleteChoreMessage'),
      onClose: isConfirmed => {
        if (isConfirmed === true) {
          deleteChores.mutate([choreId], {
            onSuccess: () => {
              Navigate('/chores')
            },
            onError: error => {
              showError({
                title: t('choreEdit.deleteFailedTitle'),
                message: t('choreEdit.deleteChoreFailedMessage', {
                  message: error.message,
                }),
              })
            },
          })
        }
        setConfirmModelConfig({})
      },
    })
  }
  if (
    (isChoreLoading && choreId) ||
    isUserLabelsLoading ||
    isUserProfileLoading ||
    isMemberDataLoading ||
    isProjectsLoading
  ) {
    return <LoadingComponent />
  }

  if (choreId && (isChoreError || !choreData?.res)) {
    return (
      <ChoreQueryStateView
        error={choreError}
        hasData={Boolean(choreData?.res)}
        onRetry={() => refetchChore()}
      />
    )
  }

  return (
    <Container maxWidth='md' sx={settingsPageSx}>
      {/* Section 1: Basic Information */}
      <Box mb={4}>
        {/* <Typography
          level='h4'
          mb={2}
          sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}
        >
          Basic Information
        </Typography> */}

        <Box mb={3}>
          <FormControl error={errors.name}>
            <Typography level='h4'>{t('choreEdit.nameLabel')}</Typography>
            <Typography level='body-md'>
              {t('choreEdit.nameDescription')}
            </Typography>
            <Input value={name} onChange={e => setName(e.target.value)} />
            <FormHelperText error>{errors.name}</FormHelperText>
          </FormControl>
        </Box>

        <Box mb={3}>
          <FormControl error={errors.description}>
            <Typography level='h4'>
              {t('choreEdit.descriptionLabel')}
            </Typography>
            <Typography level='body-md'>
              {t('choreEdit.descriptionDescription')}
            </Typography>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              entityId={choreId}
              entityType={'chore_description'}
              draftId={draftId}
            />
            <FormHelperText error>{errors.description}</FormHelperText>
          </FormControl>
        </Box>

        <Box mb={3}>
          <Typography level='h4'>{t('choreEdit.priorityLabel')}</Typography>
          <Typography level='body-md'>
            {t('choreEdit.priorityDescription')}
          </Typography>

          {/* Priority Chip Selection */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mt: 2,
            }}
          >
            {/* Priority Chips P1-P4 */}
            {Priorities.map(priorityItem => (
              <Chip
                key={priorityItem.value}
                variant={priority === priorityItem.value ? 'solid' : 'outlined'}
                color={
                  priority === priorityItem.value
                    ? priorityItem.color || 'primary'
                    : 'neutral'
                }
                size='lg'
                onClick={() => setPriority(priorityItem.value)}
                startDecorator={priorityItem.icon}
                sx={{
                  fontWeight: 'md',
                  cursor: 'pointer',
                  minHeight: 34,
                }}
              >
                {priorityItem.name}
              </Chip>
            ))}
            {/* No Priority Chip */}
            <Chip
              variant={priority === 0 ? 'solid' : 'outlined'}
              color='neutral'
              size='lg'
              onClick={() => setPriority(0)}
              startDecorator={<HorizontalRule />}
              sx={{
                fontWeight: 'md',
                cursor: 'pointer',
                minHeight: 34,
              }}
            >
              {t('choreEdit.noPriority')}
            </Chip>
          </Box>
        </Box>

        {/* Project Selection - Show only if there are multiple projects */}
        {projects.length >= 1 && (
          <Box mb={3}>
            <Typography level='h4'>{t('choreEdit.projectLabel')}</Typography>
            <Typography level='body-md'>
              {t('choreEdit.projectDescription')}
            </Typography>
            <Select
              value={projectId}
              onChange={(event, newValue) => setProjectId(newValue)}
              defaultValue='default'
              sx={{ minWidth: '15rem' }}
            >
              {/*               id: 'default',
              name: 'Default Project',
              color: LABEL_COLORS[0].value,
              icon: 'FolderOpen',
               */}
              <Option key='default' value='default'>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    size='sm'
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: DEFAULT_PROJECT_COLOR,
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent('FolderOpen')
                      return (
                        <IconComponent
                          sx={{
                            fontSize: 14,
                            color: getTextColorFromBackgroundColor(
                              DEFAULT_PROJECT_COLOR,
                            ),
                          }}
                        />
                      )
                    })()}
                  </Avatar>
                  {t('choreEdit.defaultProject')}
                </Box>
              </Option>
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      size='sm'
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: project.color || DEFAULT_PROJECT_COLOR,
                      }}
                    >
                      {project.icon ? (
                        (() => {
                          const IconComponent = getIconComponent(project.icon)
                          return (
                            <IconComponent
                              sx={{
                                fontSize: 14,
                                color: getTextColorFromBackgroundColor(
                                  project.color || DEFAULT_PROJECT_COLOR,
                                ),
                              }}
                            />
                          )
                        })()
                      ) : (
                        <></>
                      )}
                    </Avatar>
                    {project.name}
                  </Box>
                </Option>
              ))}
            </Select>
          </Box>
        )}

        <Box mb={3}>
          <Typography level='h4'>{t('choreEdit.categoryLabel')}</Typography>
          <Typography level='body-md'>
            {t('choreEdit.categoryDescription')}
          </Typography>
          <CategoryPickerField value={categoryId} onChange={setCategoryId} />
        </Box>

        <Box>
          <Typography level='h4'>{t('choreEdit.subTasksLabel')}</Typography>
          {/* <FormControl sx={{ mt: 1 }}>
            <Checkbox
              onChange={e => {
                if (e.target.checked) {
                  setSubTasks([])
                } else {
                  setSubTasks(null)
                }
              }}
              overlay
              checked={subTasks != null}
              label='Add sub tasks to this task'
            />
            <FormHelperText>Break this task into smaller steps</FormHelperText>
          </FormControl> */}
          <Card
            variant='outlined'
            sx={{
              p: 1,
              mt: 2,
            }}
          >
            <SubTasks
              editMode={true}
              tasks={subTasks ? subTasks : []}
              setTasks={setSubTasks}
              choreId={choreId}
            />
          </Card>
        </Box>

        <Box mt={3}>
          <Typography level='h4'>{t('choreEdit.attachmentsLabel')}</Typography>
          <Typography level='body-md'>
            {t('choreEdit.attachmentsDescription')}
          </Typography>
          <Card variant='outlined' sx={{ mt: 2, p: 1.5 }}>
            {attachments.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {attachments.map((att, idx) => (
                  <Box
                    key={att.file_path || idx}
                    onClick={async () => {
                      const url = await getImageSrc(
                        att.file_path,
                        att.sign ? resolvePhotoURL(att.sign) : null,
                        { choreId, kind: 'attachment' },
                      ).catch(() => resolvePhotoURL(att.sign || att.file_path))
                      const ext = (att.file_name || '')
                        .split('.')
                        .pop()
                        .toLowerCase()
                      const isImage = [
                        'jpg',
                        'jpeg',
                        'png',
                        'gif',
                        'webp',
                        'bmp',
                        'svg',
                      ].includes(ext)
                      if (isImage) {
                        setAttachmentViewerConfig({
                          isOpen: true,
                          url,
                          fileName: att.file_name,
                          onClose: () =>
                            setAttachmentViewerConfig({ isOpen: false }),
                        })
                      } else {
                        const a = document.createElement('a')
                        a.href = url
                        a.download = att.file_name || 'attachment'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: 'sm',
                      border: '1px solid',
                      borderColor: 'neutral.outlinedBorder',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'neutral.softHoverBg' },
                    }}
                  >
                    <AttachFile sx={{ fontSize: 18, color: 'neutral.500' }} />
                    <Typography
                      level='body-sm'
                      sx={{ flex: 1, wordBreak: 'break-all' }}
                    >
                      {att.file_name}
                    </Typography>
                    {att.size_bytes && (
                      <Typography level='body-xs' color='neutral'>
                        {(att.size_bytes / 1024).toFixed(1)} KB
                      </Typography>
                    )}
                    {choreId && (
                      <IconButton
                        size='sm'
                        variant='plain'
                        color='danger'
                        onClick={event => {
                          event.stopPropagation()
                          DeleteChoreAttachment(choreId, att.file_path)
                            .then(() => {
                              removeCachedImage(att.file_path)
                              setAttachments(prev =>
                                prev.filter(a => a.file_path !== att.file_path),
                              )
                            })
                            .catch(() => {
                              showError({
                                title: t('choreEdit.deleteFailedTitle'),
                                message: t(
                                  'choreEdit.deleteAttachmentFailedMessage',
                                ),
                              })
                            })
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                    {!choreId && (
                      <IconButton
                        size='sm'
                        variant='plain'
                        color='danger'
                        onClick={event => {
                          event.stopPropagation()
                          // Draft uploads live server-side too — delete there
                          // so they are not promoted onto the chore on save.
                          DeleteDraftAttachment(att.file_path)
                            .then(() => {
                              setAttachments(prev =>
                                prev.filter((_, i) => i !== idx),
                              )
                            })
                            .catch(() => {
                              showError({
                                title: t('choreEdit.deleteFailedTitle'),
                                message: t(
                                  'choreEdit.deleteAttachmentFailedMessage',
                                ),
                              })
                            })
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start' }}>
              <Button
                component='label'
                variant='outlined'
                color='neutral'
                size='sm'
                startDecorator={isUploadingAttachment ? null : <UploadFile />}
                loading={isUploadingAttachment}
              >
                {t('choreEdit.uploadFile')}
                <input
                  type='file'
                  hidden
                  onChange={async e => {
                    const file = e.target.files[0]
                    e.target.value = ''
                    await uploadAttachmentFile(file)
                  }}
                />
              </Button>
              {isNativeScanner && (
                <Button
                  variant='outlined'
                  color='neutral'
                  size='sm'
                  startDecorator={<DocumentScanner />}
                  disabled={isUploadingAttachment}
                  onClick={handleScanAttachment}
                >
                  {t('choreEdit.scan')}
                </Button>
              )}
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Section 2: Assignment & Responsibility */}
      <Box mb={4}>
        <Box mb={3}>
          <Typography level='h4'>{t('choreEdit.assigneesLabel')}</Typography>
          <Typography level='body-md'>
            {t('choreEdit.assigneesDescription')}
          </Typography>
          <Card>
            <List
              orientation='horizontal'
              wrap
              sx={{
                '--List-gap': '8px',
                '--ListItem-radius': '20px',
              }}
            >
              {/* add one for Anyone if no specific assignee is selected */}

              <ListItem key={'anyone'}>
                <Checkbox
                  checked={anyone}
                  onClick={() => {
                    setAnyone(!anyone)
                    setIsPrivate(false)
                  }}
                  overlay
                  disableIcon
                  variant='soft'
                  label={t('choreEdit.anyone')}
                />
              </ListItem>

              {performers?.map((item, index) => (
                <ListItem key={item.id}>
                  <Checkbox
                    checked={assignableTo.some(a => a.userId == item.userId)}
                    disabled={anyone}
                    onClick={() => {
                      if (anyone) {
                        setAnyone(false)
                        setAssignableTo([{ userId: item.userId }])
                        return
                      }
                      const assignees = assignableTo
                      const setAssignees = setAssignableTo
                      if (assignees.some(a => a.userId === item.userId)) {
                        const newAssignees = assignees.filter(
                          a => a.userId !== item.userId,
                        )
                        setAnyone(newAssignees.length === 0)
                        setAssignees(newAssignees)
                      } else {
                        setAssignees([...assignees, { userId: item.userId }])
                      }
                    }}
                    overlay
                    disableIcon
                    variant='soft'
                    label={item.displayName}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
          <FormControl error={Boolean(errors.assignee)}>
            <FormHelperText error>{Boolean(errors.assignee)}</FormHelperText>
          </FormControl>

          {showSaveAssigneeDefault && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'start' }}>
              <Button
                variant='outlined'
                size='sm'
                color='neutral'
                startDecorator={<Save />}
                sx={{
                  borderRadius: 6,
                  fontWeight: 500,
                  '&:hover': {
                    background: 'neutral.softHoverBg',
                  },
                }}
                onClick={() => {
                  localStorage.setItem(
                    'defaultAnyoneSetting',
                    JSON.stringify(anyone),
                  )
                  localStorage.setItem(
                    'defaultAssigneeSetting',
                    JSON.stringify(assignableTo),
                  )
                  setShowSaveAssigneeDefault(false)
                }}
              >
                {t('choreEdit.rememberForFuture')}
              </Button>
            </Box>
          )}
        </Box>

        {canPickStrategy && (
          <>
            <Box
              mb={3}
              sx={{
                display:
                  assignStrategyValue === 'no_assignee' ? 'none' : 'block',
              }}
            >
              <Typography level='h4'>
                {t('choreEdit.currentlyAssignedTo')}
              </Typography>
              <Typography level='body-md'>
                {t('choreEdit.currentlyAssignedDescription')}
              </Typography>
              <Select
                placeholder={
                  assignees.length === 0
                    ? t('choreEdit.noAssigneesPlaceholder')
                    : t('choreEdit.selectAssigneePlaceholder')
                }
                disabled={assignees.length === 0}
                value={assignedToValue}
                onChange={(_, selectedUserId) => setAssignedTo(selectedUserId)}
              >
                {performers
                  ?.filter(p => assignees.some(a => a.userId == p.userId))
                  .map((item, index) => (
                    <Option value={item.userId} key={item.displayName}>
                      {item.displayName}
                    </Option>
                  ))}
              </Select>
            </Box>

            <Box>
              <Typography level='h4'>
                {t('choreEdit.assignmentStrategy')}
              </Typography>
              <Typography level='body-md'>
                {t('choreEdit.assignmentStrategyDescription')}
              </Typography>
              <Card>
                <List
                  orientation='horizontal'
                  wrap
                  sx={{
                    '--List-gap': '8px',
                    '--ListItem-radius': '20px',
                  }}
                >
                  {ASSIGN_STRATEGIES.map((item, idx) => (
                    <ListItem key={item}>
                      <Checkbox
                        checked={assignStrategyValue === item}
                        onClick={() => setAssignStrategy(item)}
                        overlay
                        disableIcon
                        variant='soft'
                        label={item
                          .split('_')
                          .map(x => x.charAt(0).toUpperCase() + x.slice(1))
                          .join(' ')}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {/* Section 3: Schedule & Timing */}
      <Box mb={4}>
        <RepeatSection
          frequency={frequency}
          onFrequencyUpdate={setFrequency}
          frequencyType={frequencyType}
          onFrequencyTypeUpdate={setFrequencyType}
          frequencyMetadata={frequencyMetadata}
          onFrequencyMetadataUpdate={setFrequencyMetadata}
          frequencyError={errors?.frequency}
          allUserThings={allUserThings}
          onTriggerUpdate={thingUpdate => {
            if (thingUpdate === null) {
              setThingTrigger(null)
              return
            }
            setThingTrigger({
              triggerState: thingUpdate.triggerState,
              condition: thingUpdate.condition,
              thingID: thingUpdate.thing.id,
            })
          }}
          OnTriggerValidate={setIsThingValid}
          isAttemptToSave={attemptToSave}
          selectedThing={thingTrigger}
        />
        <Card sx={{ mt: 2 }}>
          <Typography level='h4'>
            {t('choreEdit.maintenanceTrigger')}
          </Typography>
          <Typography level='body-sm'>
            {t('choreEdit.maintenanceTriggerDescription')}
          </Typography>
          <Checkbox
            label={t('choreEdit.makeTaskDueFromMeter')}
            checked={!!meterSchedule}
            onChange={e =>
              setMeterSchedule(
                e.target.checked
                  ? {
                      meterId: meters[0]?.id || null,
                      interval: 1,
                      warnBefore: 0,
                    }
                  : null,
              )
            }
          />
          {meterSchedule && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems='center'
            >
              <Typography>{t('choreEdit.every')}</Typography>
              <Input
                type='number'
                slotProps={{ input: { min: 1 } }}
                value={meterSchedule.interval}
                onChange={e =>
                  setMeterSchedule({
                    ...meterSchedule,
                    interval: e.target.value,
                  })
                }
              />
              <Typography>
                {meters.find(m => m.id === meterSchedule.meterId)?.unit ||
                  t('choreEdit.units')}{' '}
                {t('choreEdit.using')}
              </Typography>
              <Select
                value={meterSchedule.meterId}
                onChange={(_, value) =>
                  setMeterSchedule({ ...meterSchedule, meterId: value })
                }
                placeholder={t('choreEdit.selectMeter')}
                sx={{ minWidth: 220 }}
              >
                {meters.map(meter => (
                  <Option key={meter.id} value={meter.id}>
                    {meter.name} ({meter.currentReading.toLocaleString()}{' '}
                    {meter.unit})
                  </Option>
                ))}
              </Select>
            </Stack>
          )}
          {meterSchedule && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems='center'
            >
              <Typography>{t('choreEdit.warnWhenWithin')}</Typography>
              <Input
                type='number'
                slotProps={{ input: { min: 0 } }}
                value={meterSchedule.warnBefore || 0}
                onChange={e =>
                  setMeterSchedule({
                    ...meterSchedule,
                    warnBefore: Number(e.target.value),
                  })
                }
              />
              <Typography>
                {meters.find(m => m.id === meterSchedule.meterId)?.unit ||
                  t('choreEdit.units')}{' '}
                {t('choreEdit.optional')}
              </Typography>
            </Stack>
          )}
          {meterSchedule && (
            <FormHelperText>
              {t('choreEdit.meterThresholdHelper')}
            </FormHelperText>
          )}
          {errors?.meterSchedule && (
            <FormHelperText color='danger'>
              {errors.meterSchedule}
            </FormHelperText>
          )}
          {meterSchedule && meters.length === 0 && (
            <Button variant='soft' onClick={() => Navigate('/meters')}>
              {t('choreEdit.createMeterFirst')}
            </Button>
          )}
        </Card>

        <Box mt={3} mb={3}>
          <Typography level='h4'>
            {REPEAT_ON_TYPE.includes(frequencyType)
              ? t('choreEdit.startDate')
              : t('choreEdit.dueDate')}
          </Typography>
          {frequencyType === 'trigger' && !dueDate && (
            <Typography level='body-sm'>
              {t('choreEdit.triggerDueDateNote')}
            </Typography>
          )}

          {NO_DUE_DATE_REQUIRED_TYPE.includes(frequencyType) && (
            <FormControl sx={{ mt: 1 }}>
              <Checkbox
                onChange={e => {
                  setDueDateDirty(true)
                  if (e.target.checked) {
                    const today = moment(new Date()).format('YYYY-MM-DD')
                    setDueDateOnly(today)
                    setDueDate(
                      moment(today).endOf('day').format('YYYY-MM-DDTHH:mm:59'),
                    )
                    setUseCustomTime(false)
                    setDueTime(null)
                  } else {
                    setDueDate(null)
                    setDueDateOnly(null)
                    setUseCustomTime(false)
                    setDueTime(null)
                  }
                }}
                defaultChecked={dueDate !== null}
                checked={dueDate !== null}
                overlay
                label={t('choreEdit.giveTaskDueDate')}
              />
              <FormHelperText>
                {t('choreEdit.taskNeedsSpecificTime')}
              </FormHelperText>
            </FormControl>
          )}
          {dueDate && (
            <>
              <FormControl error={Boolean(errors.dueDate)} sx={{ mt: 2 }}>
                <Typography level='body-md'>
                  {REPEAT_ON_TYPE.includes(frequencyType)
                    ? t('choreEdit.whenDoesTaskStart')
                    : t('choreEdit.whenIsTaskDue')}
                </Typography>
                <Input
                  type='date'
                  value={dueDateOnly || ''}
                  onChange={handleDueDateChange}
                />
                <FormHelperText>{errors.dueDate}</FormHelperText>
              </FormControl>

              {/* Optional time picker */}
              <FormControl sx={{ mt: 2 }}>
                <Checkbox
                  checked={useCustomTime}
                  onChange={e => handleUseCustomTimeChange(e.target.checked)}
                  overlay
                  label={t('choreEdit.setSpecificTime')}
                />
                <FormHelperText>
                  {useCustomTime
                    ? t('choreEdit.dueAtSpecifiedTime')
                    : t('choreEdit.dueAtEndOfDay')}
                </FormHelperText>
              </FormControl>

              {useCustomTime && (
                <Box sx={{ mt: 2, ms: 4 }}>
                  <Typography level='body-sm' mb={1}>
                    {t('choreEdit.time')}
                  </Typography>
                  <Input
                    type='time'
                    value={dueTime || '18:00'}
                    onChange={handleDueTimeChange}
                    sx={{ maxWidth: 200 }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {dueDate && (
          <Box mb={3}>
            <Typography level='h4'>{t('choreEdit.taskWindow')}</Typography>
            <Typography level='body-md'>
              {t('choreEdit.taskWindowDescription')}
            </Typography>

            {/* Available From (Completion Window) */}
            <FormControl sx={{ mt: 1 }}>
              <Checkbox
                checked={completionWindow !== -1}
                onChange={e => {
                  if (e.target.checked) {
                    setCompletionWindow(1) // default 1 hour in seconds
                  } else {
                    setCompletionWindow(-1)
                  }
                }}
                overlay
                label={t('choreEdit.setEarliestCompletionTime')}
              />
              <FormHelperText>
                {t('choreEdit.earliestCompletionHelper')}
              </FormHelperText>
            </FormControl>

            {completionWindow !== -1 && (
              <Card variant='outlined'>
                <Box
                  sx={{
                    mt: 0,
                    ms: 4,
                  }}
                >
                  <Typography level='body-sm'>
                    {t('choreEdit.hours')}
                  </Typography>
                  <Input
                    type='number'
                    value={completionWindow}
                    sx={{ maxWidth: 100 }}
                    slotProps={{
                      input: {
                        min: 0,
                        max: 24 * 7,
                      },
                    }}
                    placeholder={t('choreEdit.hoursPlaceholder')}
                    onChange={e => {
                      setCompletionWindow(parseInt(e.target.value))
                    }}
                  />
                </Box>
              </Card>
            )}

            {/* Expires After (Deadline) */}
            {/* <FormControl sx={{ mt: 2 }}>
              <Checkbox
                checked={deadlineOffset !== -1}
                disabled={isRolling}
                onChange={e => {
                  if (e.target.checked) {
                    setDeadlineOffset(86400) // default 1 day in seconds
                  } else {
                    setDeadlineOffset(-1)
                  }
                }}
                overlay
                label='Set a deadline'
              />
              <FormHelperText>
                {isRolling && !['once', 'no_repeat'].includes(frequencyType)
                  ? 'Deadline is not available when scheduling from completion date'
                  : 'Task will be considered expired after the due date'}
              </FormHelperText>
            </FormControl> */}

            {deadlineOffset !== -1 && (
              <Box
                sx={{
                  mt: 1,
                  ms: 4,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <DurationInput
                  value={deadlineOffset}
                  onChange={setDeadlineOffset}
                  size='sm'
                  minValue={0}
                />
                <Typography level='body-sm'>
                  {t('choreEdit.afterDueDate')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {!['once', 'no_repeat'].includes(frequencyType) && (
          <Box>
            <Typography level='h4'>
              {t('choreEdit.schedulingPreferences')}
            </Typography>
            <Typography level='body-md'>
              {t('choreEdit.schedulingPreferencesDescription')}
            </Typography>
            <RadioGroup name='tiers' sx={{ gap: 1, '& > div': { p: 1 } }}>
              <FormControl>
                <Radio
                  overlay
                  checked={!isRolling}
                  onClick={() => setIsRolling(false)}
                  label={t('choreEdit.rescheduleFromDueDate')}
                />
                <FormHelperText>
                  {t('choreEdit.rescheduleFromDueDateHelper')}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <Radio
                  overlay
                  checked={isRolling}
                  onClick={() => {
                    setIsRolling(true)
                    setDeadlineOffset(-1)
                  }}
                  label={t('choreEdit.rescheduleFromCompletionDate')}
                />
                <FormHelperText>
                  {t('choreEdit.rescheduleFromCompletionDateHelper')}
                </FormHelperText>
              </FormControl>
            </RadioGroup>
          </Box>
        )}
        {/* Section 3.1: Notifications */}

        <Box mb={3}>
          <Typography level='h4'>
            {t('choreEdit.notificationsLabel')}
          </Typography>
          {!isPlusAccount(userProfile) && (
            <Typography level='body-sm' color='warning' sx={{ mb: 1 }}>
              {t('choreEdit.notificationsUpgradeWarning')}
            </Typography>
          )}

          <FormControl sx={{ mt: 1 }}>
            <Checkbox
              onChange={e => {
                setIsNotificable(e.target.checked)
                if (!e.target.checked) {
                  setNotificationMetadata({})
                }
              }}
              defaultChecked={isNotificable}
              checked={isNotificable}
              disabled={!isPlusAccount(userProfile)}
              overlay
              label={t('choreEdit.notifyForTask')}
            />
            <FormHelperText
              sx={{
                opacity: !isPlusAccount(userProfile) ? 0.5 : 1,
              }}
            >
              {t('choreEdit.notifyForTaskHelper')}
            </FormHelperText>
          </FormControl>
        </Box>

        {isNotificable && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Card variant='outlined'>
              <Typography level='h4' mb={2}>
                {t('choreEdit.notificationSchedule')}
              </Typography>
              <Box sx={{ p: 0.5 }}>
                <NotificationTemplate
                  onChange={metadata => {
                    const newTemplates = metadata.notifications
                    if (notificationMetadata?.templates !== newTemplates) {
                      setNotificationMetadata({
                        ...notificationMetadata,
                        templates: newTemplates,
                      })
                    }
                  }}
                  value={notificationMetadata}
                />
              </Box>

              <Typography level='h4' mt={3} mb={2}>
                {t('choreEdit.whoToNotify')}
              </Typography>
              <FormControl>
                <Checkbox
                  overlay
                  disabled={true}
                  checked={true}
                  label={t('choreEdit.allAssignees')}
                />
                <FormHelperText>
                  {t('choreEdit.notifyAllAssignees')}
                </FormHelperText>
              </FormControl>

              <FormControl>
                <Checkbox
                  overlay
                  onClick={() => {
                    if (notificationMetadata?.circleGroup) {
                      delete notificationMetadata.circleGroupID
                    }

                    setNotificationMetadata({
                      ...notificationMetadata,
                      circleGroup: !notificationMetadata?.circleGroup,
                    })
                  }}
                  checked={
                    notificationMetadata
                      ? notificationMetadata?.circleGroup
                      : false
                  }
                  label={t('choreEdit.specificGroup')}
                />
                <FormHelperText>
                  {t('choreEdit.notifySpecificGroup')}
                </FormHelperText>
              </FormControl>

              {notificationMetadata?.circleGroup && (
                <Box
                  sx={{
                    mt: 0,
                    ms: 4,
                  }}
                >
                  <Typography level='body-sm'>
                    {t('choreEdit.telegramGroupId')}
                  </Typography>
                  <Input
                    type='number'
                    value={notificationMetadata?.circleGroupID}
                    placeholder={t('choreEdit.telegramGroupIdPlaceholder')}
                    onChange={e => {
                      setNotificationMetadata({
                        ...notificationMetadata,
                        circleGroupID: parseInt(e.target.value),
                      })
                    }}
                  />
                </Box>
              )}
            </Card>
          </Box>
        )}
      </Box>

      {/* Section 4: Task Settings */}
      <Box mb={4}>
        <Typography
          level='h3'
          mb={2}
          sx={{
            borderColor: 'primary.main',
            pb: 1,
          }}
        >
          {t('choreEdit.taskSettings')}
        </Typography>

        <Box mb={3}>
          <Typography level='h4'>{t('choreEdit.pointsSystem')}</Typography>
          <FormControl sx={{ mt: 1 }}>
            <Checkbox
              onChange={e => {
                if (e.target.checked) {
                  setPoints(1)
                } else {
                  setPoints(-1)
                }
              }}
              checked={points > -1}
              overlay
              label={t('choreEdit.assignPointsForCompletion')}
            />
            <FormHelperText>{t('choreEdit.pointsSystemHelper')}</FormHelperText>
          </FormControl>
          {points != -1 && (
            <Card variant='outlined' sx={{ mt: 2 }}>
              <Box
                sx={{
                  mt: 0,
                  ms: 4,
                }}
              >
                <Typography level='body-sm'>
                  {t('choreEdit.pointsLabel')}
                </Typography>
                <Input
                  type='number'
                  value={points}
                  sx={{ maxWidth: 100 }}
                  slotProps={{
                    input: {
                      min: 0,
                      max: 1000,
                    },
                  }}
                  placeholder={t('choreEdit.pointsPlaceholder')}
                  onChange={e => {
                    setPoints(parseInt(e.target.value))
                  }}
                />
              </Box>
            </Card>
          )}
        </Box>

        <Box mb={3}>
          <Typography level='h4'>
            {t('choreEdit.approvalRequirement')}
          </Typography>
          <FormControl sx={{ mt: 1 }}>
            <Checkbox
              onChange={e => {
                setRequireApproval(e.target.checked)
              }}
              checked={requireApproval}
              overlay
              label={t('choreEdit.requireAdminApproval')}
            />
            <FormHelperText>
              {t('choreEdit.approvalRequirementHelper')}
            </FormHelperText>
          </FormControl>
        </Box>

        <Box>
          <Typography level='h4'>{t('choreEdit.privacySettings')}</Typography>
          <Typography level='body-md'>
            {t('choreEdit.privacySettingsDescription')}
          </Typography>
          <RadioGroup
            name='isPrivate'
            value={isPrivate}
            onChange={event => {
              const newValue = event.target.value === 'true' ? true : false
              setIsPrivate(newValue)
              setShowSavePrivacyDefault(true)
            }}
            sx={{
              '& > div': { py: 1 },
            }}
          >
            <FormControl>
              <Radio overlay value={false} label={t('choreEdit.public')} />
              <FormHelperText>{t('choreEdit.publicHelper')}</FormHelperText>
            </FormControl>
            <FormControl>
              <Radio
                overlay
                disabled={anyone || assignableTo.length === 0}
                value={true}
                label={t('choreEdit.limited')}
              />
              <FormHelperText>
                {t('choreEdit.limitedHelper')}
                {anyone || assignableTo.length === 0
                  ? t('choreEdit.limitedHelperNoAssignees')
                  : ''}
              </FormHelperText>
            </FormControl>
          </RadioGroup>

          {showSavePrivacyDefault && (
            <Box sx={{ mt: 0, display: 'flex', justifyContent: 'start' }}>
              <Button
                variant='outlined'
                size='sm'
                color='neutral'
                startDecorator={<Save />}
                sx={{
                  borderRadius: 6,
                  fontWeight: 500,
                  '&:hover': {
                    background: 'neutral.softHoverBg',
                  },
                }}
                onClick={() => {
                  localStorage.setItem(
                    'defaultPrivacySetting',
                    JSON.stringify(isPrivate),
                  )
                  setShowSavePrivacyDefault(false)
                }}
              >
                {t('choreEdit.rememberForFuture')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {choreId > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 3 }}>
          <Sheet
            sx={{
              p: 2,
              borderRadius: 'md',
              boxShadow: 'sm',
            }}
          >
            <Typography level='body1'>
              {t('choreEdit.createdBy')}{' '}
              <Chip variant='solid'>
                {membersData.res.find(f => f.userId === createdBy)?.displayName}
              </Chip>{' '}
              {moment(chore.createdAt).fromNow()}
            </Typography>
            {(chore.updatedAt && updatedBy > 0 && (
              <>
                <Divider sx={{ my: 1 }} />

                <Typography level='body1'>
                  {t('choreEdit.updatedBy')}{' '}
                  <Chip variant='solid'>
                    {
                      membersData.res.find(f => f.userId === updatedBy)
                        ?.displayName
                    }
                  </Chip>{' '}
                  {moment(chore.updatedAt).fromNow()}
                </Typography>
              </>
            )) || <></>}
          </Sheet>
        </Box>
      )}

      <Divider sx={{ mb: 9 }} />

      {/* <Box mt={2} alignSelf={'flex-start'} display='flex' gap={2}>
        <Button onClick={SaveChore}>Save</Button>
      </Box> */}
      <Sheet
        variant='outlined'
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2, // padding
          paddingBottom: getSafeBottomPadding(2), // safe area padding for iOS
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          'z-index': 1000,
          bgcolor: 'background.body',
          boxShadow: 'md', // Add a subtle shadow
        }}
      >
        {choreId > 0 && (
          <Dropdown>
            <ButtonGroup
              variant='outlined'
              color={isActive ? 'danger' : 'neutral'}
            >
              <Button
                onClick={() => {
                  isActive
                    ? archiveChore.mutate(choreId)
                    : unarchiveChore.mutate(choreId)
                }}
              >
                {isActive ? t('choreEdit.archive') : t('choreEdit.unarchive')}
              </Button>
              <MenuButton
                slots={{ root: IconButton }}
                slotProps={{
                  root: {
                    variant: 'outlined',
                    color: isActive ? 'danger' : 'neutral',
                  },
                }}
              >
                <ArrowDropDown />
              </MenuButton>
            </ButtonGroup>
            <Menu placement='top-end'>
              <MenuItem color='danger' onClick={handleDelete}>
                {t('delete')}
              </MenuItem>
            </Menu>
          </Dropdown>
        )}
        <Button
          color='neutral'
          variant='outlined'
          onClick={() => {
            window.history.back()
          }}
        >
          {t('choreEdit.cancel')}
          {showKeyboardShortcuts && (
            <KeyboardShortcutHint shortcut='Esc' sx={{ ms: 1 }} />
          )}
        </Button>
        <Button
          color='primary'
          variant='solid'
          onClick={HandleSaveChore}
          loading={
            createChoreMutation.isPending || updateChoreMutation.isPending
          }
          disabled={
            createChoreMutation.isPending || updateChoreMutation.isPending
          }
        >
          {choreId > 0 ? t('save') : t('choreEdit.create')}
          {showKeyboardShortcuts && (
            <KeyboardShortcutHint shortcut='Enter' sx={{ ms: 1 }} />
          )}
        </Button>
      </Sheet>
      <AttachmentViewerModal config={attachmentViewerConfig} />
      <ConfirmationModal config={confirmModelConfig} />
      {addLabelModalOpen && (
        <LabelModal
          isOpen={addLabelModalOpen}
          onSave={label => {
            const newLabels = [...labelsV2]
            newLabels.push(label)
            setUserLabels([...userLabels, label])

            setLabelsV2([...labelsV2, label])
            setAddLabelModalOpen(false)
          }}
          onClose={() => setAddLabelModalOpen(false)}
        />
      )}
      {/* <ChoreHistory ChoreHistory={choresHistory} UsersData={performers} /> */}
    </Container>
  )
}

export default ChoreEdit
