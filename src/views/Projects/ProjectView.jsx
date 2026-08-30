import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { useChores, useMarkChoreComplete } from '../../queries/ChoreQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { DEFAULT_PROJECT_COLOR } from '../../utils/Colors'
import { DeleteProject } from '../../utils/Fetcher'
import {
  EFFECTIVE_ROLES,
  normalizeCircleMembers,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import { useProjectFilter } from '../Chores/hooks/useProjectFilter'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import ProjectModal from '../Modals/Inputs/ProjectModal'
import FigmaProjectsScreen from './FigmaProjectsScreen'
import { useProjects } from './ProjectQueries'
import {
  choreProjectId,
  projectOwner as resolveProjectOwner,
  projectProgress,
  projectStatus,
} from './projectViewModel'
const ProjectView = () => {
  const { t } = useTranslation('common')
  const {
    data: projectsData = [],
    isError,
    isLoading: projectsLoading,
    refetch,
  } = useProjects()
  const { data: userProfile } = useUserProfile()
  const { data: circleMembers } = useCircleMembers()
  const { data: chores = { res: [] } } = useChores(false)
  const members = normalizeCircleMembers(circleMembers)
  const effectiveRole = resolveEffectiveRole(userProfile, members)
  const isChild =
    effectiveRole === EFFECTIVE_ROLES.CHILD ||
    effectiveRole === EFFECTIVE_ROLES.NONE
  const canCreate = !isChild
  const markComplete = useMarkChoreComplete()
  const { setSelectedProjectWithCache } = useProjectFilter(
    projectsData,
    !projectsLoading,
  )
  const navigate = useNavigate()

  const [userProjects, setUserProjects] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState(null)
  const [taskCounts, setTaskCounts] = useState({})
  const queryClient = useQueryClient()
  const [confirmationModel, setConfirmationModel] = useState({})

  const handleAddProject = () => {
    setCurrentProject(null)
    setModalOpen(true)
  }

  const handleEditProject = project => {
    setCurrentProject(project)
    setModalOpen(true)
  }

  const handleDeleteClicked = id => {
    const project = userProjects.find(p => p.id === id)
    setConfirmationModel({
      isOpen: true,
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project?.name}"? This will remove the project but keep all tasks (they'll move to the Default Project).`,
      confirmText: 'Delete',
      color: 'danger',
      cancelText: 'Cancel',
      onClose: confirmed => {
        if (confirmed === true) {
          handleDeleteProject(id)
        }
        setConfirmationModel({})
      },
    })
  }

  const handleDeleteProject = id => {
    DeleteProject(id).then(() => {
      const updatedProjects = userProjects.filter(project => project.id !== id)
      setUserProjects(updatedProjects)
      queryClient.invalidateQueries('projects')

      // If the deleted project was the active project, clear it
      const saved = localStorage.getItem('selectedProject')
      if (saved) {
        const savedProject = JSON.parse(saved)
        if (savedProject && savedProject.id === id) {
          setSelectedProjectWithCache(null)
        }
      }
    })
  }

  const handleSaveProject = () => {
    setModalOpen(false)
  }

  useEffect(() => {
    if (projectsData) {
      setUserProjects(projectsData)
    }
  }, [projectsData])

  // Calculate real task counts from chores data
  useEffect(() => {
    if (chores && chores.res) {
      const choresList = chores.res
      const realCounts = {}

      // First, count tasks for the default project (tasks without a projectId)
      const defaultProjectCount = choresList.filter(chore => {
        const choreProjectId = chore.projectId || chore.project_id
        return (
          !choreProjectId ||
          choreProjectId === '' ||
          choreProjectId === 'default' ||
          choreProjectId === null
        )
      }).length
      realCounts['default'] = defaultProjectCount

      // Then count tasks for each user project
      userProjects.forEach(project => {
        const choreCount = choresList.filter(chore => {
          const choreProjectId = chore.projectId || chore.project_id
          return choreProjectId === project.id
        }).length

        realCounts[project.id] = choreCount
      })

      setTaskCounts(realCounts)
    }
  }, [chores, userProjects])

  const choresList = chores.res || []
  const projectCards = [
    {
      id: 'default',
      name: 'Default Project',
      description: 'All tasks without a specific project',
      color: DEFAULT_PROJECT_COLOR,
      status: projectStatus(choresList, 'default'),
      progress: projectProgress(choresList, 'default'),
      taskCount: choresList.filter(chore => choreProjectId(chore) === 'default')
        .length,
      owner: null,
    },
    ...userProjects.map(project => ({
      ...project,
      color: project.color || DEFAULT_PROJECT_COLOR,
      status: projectStatus(choresList, project.id),
      progress: projectProgress(choresList, project.id),
      taskCount: choresList.filter(
        chore => choreProjectId(chore) === project.id,
      ).length,
      owner: resolveProjectOwner(project, members, userProfile),
    })),
  ]

  const canManageProject = project => {
    if (!project || project.id === 'default') return false
    if (effectiveRole === EFFECTIVE_ROLES.OWNER) return true
    if (effectiveRole === EFFECTIVE_ROLES.CHILD) return false
    return String(project.created_by) === String(userProfile?.id)
  }

  const handleOpenTask = task => {
    navigate(`/chores/${task.id}`)
  }

  const handleCompleteTask = (task, done) => {
    if (done) return
    markComplete.mutate({ choreId: task.id })
  }

  if (projectsLoading) {
    return <QueryLoadingView />
  }

  if (isError) {
    return (
      <EmptyState
        variant='error'
        size='sm'
        title={t('errors.projectsLoadFailed')}
        description={t('errors.pleaseTryAgain')}
        primaryAction={{ label: t('retry'), onClick: () => refetch() }}
      />
    )
  }

  return (
    <>
      <FigmaProjectsScreen
        canCreate={canCreate}
        canManageProject={canManageProject}
        chores={choresList}
        members={members}
        onCompleteTask={handleCompleteTask}
        onDeleteProject={handleDeleteClicked}
        onEditProject={handleEditProject}
        onNewProject={handleAddProject}
        onOpenTask={handleOpenTask}
        profile={userProfile}
        projects={projectCards}
      />

      {modalOpen && (
        <ProjectModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveProject}
          project={currentProject}
        />
      )}

      <ConfirmationModal config={confirmationModel} />
    </>
  )
}

export default ProjectView
