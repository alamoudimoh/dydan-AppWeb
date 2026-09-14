import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import KeyboardShortcutHint from '../../components/common/KeyboardShortcutHint'
import FigmaIcon from '../../components/FigmaIcon'
import LABEL_COLORS, {
  getTextColorFromBackgroundColor,
} from '../../utils/Colors'
import ProjectModal from '../Modals/Inputs/ProjectModal'
import { useProjects } from '../Projects/ProjectQueries'

const ProjectSelector = ({
  onProjectSelect,
  selectedProject = 'Default Project',
  showKeyboardShortcuts = false,
}) => {
  const { data: projects = [], isLoading } = useProjects()
  const navigate = useNavigate()

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  const defaultProjects = projects

  // Check if selected project still exists, if not fallback to default
  const selectedProjectExists = defaultProjects.some(
    p => p.name === selectedProject,
  )
  const effectiveSelectedProject = selectedProjectExists
    ? selectedProject
    : 'Default Project'

  // Notify parent if selected project was deleted
  useEffect(() => {
    if (!selectedProjectExists && selectedProject !== 'Default Project') {
      const defaultProject = defaultProjects.find(
        p => p.id === 'default' || p.name === 'Default Project',
      )
      if (defaultProject) {
        onProjectSelect?.(defaultProject)
      }
    }
  }, [selectedProjectExists, selectedProject, defaultProjects, onProjectSelect])

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
    setIsKeyboardNavigating(false)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProjectSelect = project => {
    onProjectSelect?.(project)
    handleMenuClose()
  }

  const handleAddProjectClick = () => {
    setIsProjectModalOpen(true)
    handleMenuClose()
  }

  const handleProjectModalSave = project => {
    handleProjectSelect(project)
  }

  const handleManageProjects = () => {
    navigate('/projects')
    handleMenuClose()
  }

  useEffect(() => {
    const handleMenuOutsideClick = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        handleMenuClose()
      }
    }

    document.addEventListener('mousedown', handleMenuOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleMenuOutsideClick)
    }
  }, [])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = event => {
      const isHoldingCmdOrCtrl = event.ctrlKey || event.metaKey

      // Cmd/Ctrl + E to open project menu
      if (isHoldingCmdOrCtrl && event.key === 'e') {
        event.preventDefault()
        if (!anchorEl) {
          setAnchorEl(buttonRef.current)
          setSelectedIndex(0)
          setIsKeyboardNavigating(true)
        } else {
          handleMenuClose()
        }
        return
      }

      // Only handle navigation keys when menu is open
      if (!anchorEl) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setIsKeyboardNavigating(true)
          setSelectedIndex(prev =>
            prev < defaultProjects.length + 2 ? prev + 1 : prev,
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setIsKeyboardNavigating(true)
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex === 0) {
            // Hardcoded Default Project
            handleProjectSelect({
              id: 'default',
              name: 'Default Project',
              color: LABEL_COLORS[0].value,
              icon: 'FolderOpen',
            })
          } else if (selectedIndex <= defaultProjects.length) {
            // Projects from the array (offset by 1)
            handleProjectSelect(defaultProjects[selectedIndex - 1])
          } else if (selectedIndex === defaultProjects.length + 1) {
            handleAddProjectClick()
          } else {
            handleManageProjects()
          }
          break
        case 'Escape':
          event.preventDefault()
          handleMenuClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorEl, selectedIndex, defaultProjects, isKeyboardNavigating])

  // Reset selected index when menu opens
  useEffect(() => {
    if (anchorEl) {
      setSelectedIndex(0)
    }
  }, [anchorEl])

  // Find the currently selected project
  const currentProject = defaultProjects.find(
    p => p.name === effectiveSelectedProject,
  )

  return (
    <>
      <div
        className='figma-project-selector'
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <button
          ref={buttonRef}
          onClick={handleMenuOpen}
          className='figma-icon-button figma-project-selector__trigger'
          type='button'
          style={{
            height: 24,
            width: 24,
            borderRadius: 24,
            backgroundColor: currentProject?.color || LABEL_COLORS[0].value,
            border: '1px solid var(--line)',
            color: getTextColorFromBackgroundColor(
              currentProject?.color || LABEL_COLORS[0].value,
            ),
            alignItems: 'center',
            cursor: 'pointer',
            display: 'inline-flex',
            justifyContent: 'center',
            padding: 0,
          }}
          title={`Current project: ${effectiveSelectedProject} (Ctrl+E)`}
          aria-haspopup='menu'
          aria-expanded={Boolean(anchorEl)}
        >
          <FigmaIcon icon={currentProject?.icon || 'FolderOpen'} size={16} />
        </button>
        <KeyboardShortcutHint
          shortcut='E'
          show={showKeyboardShortcuts}
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 1000,
          }}
        />

        {anchorEl && (
          <div
            ref={menuRef}
            className='figma-dropdown-menu figma-project-selector__menu'
            role='menu'
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              boxShadow: 'var(--shadow-lg)',
              left: 0,
              minWidth: 280,
              padding: 4,
              position: 'absolute',
              top: 'calc(100% + 4px)',
              zIndex: 1000,
            }}
          >
            <div
              className='figma-menu-header'
              style={{
                alignItems: 'center',
                color: 'var(--t-primary)',
                display: 'flex',
                fontSize: 13,
                fontWeight: 600,
                gap: 8,
                padding: '8px 10px',
              }}
            >
              <FigmaIcon icon='FolderOpen' size={16} />
              Projects
            </div>

            <div
              className='figma-menu-divider'
              role='separator'
              style={{
                backgroundColor: 'var(--line)',
                height: 1,
                margin: '4px 0',
              }}
            />

            <button
              className='figma-menu-item figma-project-selector__menu-item'
              type='button'
              onClick={() =>
                handleProjectSelect({
                  id: 'default',
                  name: 'Default Project',
                  color: LABEL_COLORS[0].value,
                  icon: 'FolderOpen',
                })
              }
              onMouseEnter={() => setIsKeyboardNavigating(false)}
              style={{
                alignItems: 'center',
                backgroundColor:
                  effectiveSelectedProject === 'Default Project'
                    ? 'var(--brand-faint)'
                    : selectedIndex === 0 && anchorEl && isKeyboardNavigating
                      ? 'var(--surface-2)'
                      : 'transparent',
                border: 0,
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                display: 'flex',
                gap: 8,
                padding: '8px 10px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span
                className='figma-project-selector__avatar'
                style={{
                  alignItems: 'center',
                  backgroundColor: LABEL_COLORS[0].value,
                  borderRadius: 'var(--r-sm)',
                  color: getTextColorFromBackgroundColor(LABEL_COLORS[0].value),
                  display: 'flex',
                  flex: '0 0 24px',
                  height: 24,
                  justifyContent: 'center',
                  width: 24,
                }}
              >
                <FigmaIcon icon='FolderOpen' size={14} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    alignItems: 'center',
                    color:
                      effectiveSelectedProject === 'Default Project'
                        ? 'var(--brand)'
                        : 'var(--t-primary)',
                    display: 'flex',
                    fontSize: 13,
                    fontWeight:
                      effectiveSelectedProject === 'Default Project'
                        ? 600
                        : 400,
                    justifyContent: 'space-between',
                  }}
                >
                  Default Project
                  {effectiveSelectedProject === 'Default Project' && (
                    <FigmaIcon icon='Check' size={16} />
                  )}
                </span>
                <span
                  style={{
                    color: 'var(--t-muted)',
                    display: 'block',
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  Built-in project workspace
                </span>
              </span>
            </button>
            {defaultProjects.map((project, index) => (
              <button
                key={project.id}
                className='figma-menu-item figma-project-selector__menu-item'
                type='button'
                onClick={() => handleProjectSelect(project)}
                onMouseEnter={() => setIsKeyboardNavigating(false)}
                style={{
                  alignItems: 'center',
                  backgroundColor:
                    effectiveSelectedProject === project.name
                      ? 'var(--brand-faint)'
                      : selectedIndex === index + 1 &&
                          anchorEl &&
                          isKeyboardNavigating
                        ? 'var(--surface-2)'
                        : 'transparent',
                  border: 0,
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 8,
                  padding: '8px 10px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  className='figma-project-selector__avatar'
                  style={{
                    alignItems: 'center',
                    backgroundColor: project.color || LABEL_COLORS[0].value,
                    borderRadius: 'var(--r-sm)',
                    color: getTextColorFromBackgroundColor(
                      project.color || LABEL_COLORS[0].value,
                    ),
                    display: 'flex',
                    flex: '0 0 24px',
                    height: 24,
                    justifyContent: 'center',
                    width: 24,
                  }}
                >
                  <FigmaIcon icon={project.icon || 'FolderOpen'} size={14} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      alignItems: 'center',
                      color:
                        effectiveSelectedProject === project.name
                          ? 'var(--brand)'
                          : 'var(--t-primary)',
                      display: 'flex',
                      fontSize: 13,
                      fontWeight:
                        effectiveSelectedProject === project.name ? 600 : 400,
                      justifyContent: 'space-between',
                    }}
                  >
                    {project.name}
                    {effectiveSelectedProject === project.name && (
                      <FigmaIcon icon='Check' size={16} />
                    )}
                  </span>
                  {project.id === 'default' && (
                    <span
                      style={{
                        color: 'var(--t-muted)',
                        display: 'block',
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      Built-in project workspace
                    </span>
                  )}
                </span>
              </button>
            ))}

            <div
              className='figma-menu-divider'
              role='separator'
              style={{
                backgroundColor: 'var(--line)',
                height: 1,
                margin: '4px 0',
              }}
            />

            <button
              className='figma-menu-item figma-project-selector__menu-item'
              type='button'
              onClick={handleAddProjectClick}
              onMouseEnter={() => setIsKeyboardNavigating(false)}
              style={{
                alignItems: 'center',
                backgroundColor:
                  selectedIndex === defaultProjects.length + 1 &&
                  anchorEl &&
                  isKeyboardNavigating
                    ? 'var(--brand-faint)'
                    : 'transparent',
                border: 0,
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                display: 'flex',
                gap: 8,
                padding: '8px 10px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <FigmaIcon icon='Add' size={16} />
              <span>
                <span
                  style={{
                    color: 'var(--t-primary)',
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Create New Project
                </span>
                <span
                  style={{
                    color: 'var(--t-muted)',
                    display: 'block',
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  Add a custom project workspace
                </span>
              </span>
            </button>

            <button
              className='figma-menu-item figma-project-selector__menu-item'
              type='button'
              onClick={handleManageProjects}
              onMouseEnter={() => setIsKeyboardNavigating(false)}
              style={{
                alignItems: 'center',
                backgroundColor:
                  selectedIndex === defaultProjects.length + 2 &&
                  anchorEl &&
                  isKeyboardNavigating
                    ? 'var(--surface-2)'
                    : 'transparent',
                border: 0,
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                display: 'flex',
                gap: 8,
                padding: '8px 10px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <FigmaIcon icon='Settings' size={16} />
              <span>
                <span
                  style={{
                    color: 'var(--t-primary)',
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Manage Projects
                </span>
                <span
                  style={{
                    color: 'var(--t-muted)',
                    display: 'block',
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  View, edit, and organize all projects
                </span>
              </span>
            </button>
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleProjectModalSave}
        project={null}
      />
    </>
  )
}

export default ProjectSelector
