import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEFAULT_PROJECT_COLOR } from '../../../utils/Colors'

export const useProjectFilter = (projects, projectsLoaded = false) => {
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('selectedProject')
    return saved ? JSON.parse(saved) : null
  })

  const projectsWithDefault = useMemo(() => {
    const defaultProject = {
      id: 'default',
      name: 'Default Project',
      description: 'Your default project workspace',
      color: DEFAULT_PROJECT_COLOR,
      icon: 'FolderOpen',
    }

    const hasDefault = projects.some(
      p => p.id === 'default' || p.name === 'Default Project',
    )

    return hasDefault ? projects : [defaultProject, ...projects]
  }, [projects])

  const setSelectedProjectWithCache = useCallback(project => {
    const finalProject = project || null

    setSelectedProject(finalProject)
    localStorage.setItem('selectedProject', JSON.stringify(finalProject))

    const newUrl = new URL(window.location)
    if (finalProject && finalProject.id !== 'default') {
      newUrl.searchParams.set('project', encodeURIComponent(finalProject.id))
    } else {
      newUrl.searchParams.delete('project')
    }
    window.history.replaceState({}, '', newUrl)
  }, [])

  // The cached selection is a whole project object, so a stale one keeps
  // rendering its old name/color even though the project no longer belongs to
  // this account (deleted project, or a different user signing in on a device
  // where logout didn't get to clear storage). Once the real list has loaded,
  // drop any selection that isn't in it.
  useEffect(() => {
    if (!projectsLoaded) return
    if (!selectedProject || selectedProject.id === 'default') return

    if (!projects.some(p => p.id === selectedProject.id)) {
      setSelectedProjectWithCache(null)
    }
  }, [projectsLoaded, projects, selectedProject, setSelectedProjectWithCache])

  return {
    selectedProject,
    projectsWithDefault,
    setSelectedProjectWithCache,
  }
}
