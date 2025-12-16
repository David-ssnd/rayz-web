'use client'

import { useEffect, useState, useTransition } from 'react'
import { createProject, deleteProject } from '@/features/projects/actions'
import {
  ArrowUpRightIcon,
  ChevronDown,
  FolderX,
  Gamepad2,
  LayoutDashboard,
  Monitor,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DeviceConnectionsProvider } from '@/lib/websocket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { GameOverview } from './project-manager/GameOverview'
import { PlayerManager } from './project-manager/PlayerManager'
import { ProjectDeviceManager } from './project-manager/ProjectDeviceManager'
import { ProjectSettingsManager } from './project-manager/ProjectSettingsManager'
import { TeamManager } from './project-manager/TeamManager'
import { Device, GameMode, Project } from './project-manager/types'

interface ProjectManagerProps {
  projects: Project[]
  availableDevices: Device[] // Devices in user inventory but not in this project (or all devices)
  gameModes: GameMode[]
}

export function ProjectManager({ projects, availableDevices, gameModes }: ProjectManagerProps) {
  const t = useTranslations('Control') // Assuming translations exist
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null)
  const [isPending, startTransition] = useTransition()
  const [newProjectName, setNewProjectName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const [localProjects, setLocalProjects] = useState<Project[]>(projects)

  useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  const selectedProject = localProjects.find((p) => p.id === selectedProjectId)

  const handleCreateProject = () => {
    if (!newProjectName) return
    startTransition(async () => {
      const res = await createProject(newProjectName)
      if (res.success) {
        setNewProjectName('')
        const created = { ...(res.project as any), devices: [], players: [], teams: [] } as Project
        setLocalProjects((prev) => [...prev, created])
        setSelectedProjectId(created.id)
        setMenuOpen(false)
      }
    })
  }

  const handleDeleteProject = (id: string) => {
    if (!confirm('Are you sure?')) return
    startTransition(async () => {
      await deleteProject(id)
      setLocalProjects((prev) => prev.filter((p) => p.id !== id))
      if (selectedProjectId === id) setSelectedProjectId(null)
    })
  }

  useEffect(() => {
    if (!selectedProject && localProjects.length > 0) {
      setSelectedProjectId(localProjects[0].id)
    }
  }, [localProjects, selectedProject])

  return (
    <div className="flex-1 min-h-screen">
      {localProjects.length === 0 ? (
        <Card className="border-dashed border-3">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderX />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any projects yet. Get started by creating your first
                project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={() => {
                    handleCreateProject()
                  }}
                  disabled={isPending || !newProjectName}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </EmptyContent>
            <Button variant="link" asChild className="text-muted-foreground" size="sm">
              <a href="#">
                Learn More <ArrowUpRightIcon />
              </a>
            </Button>
          </Empty>
        </Card>
      ) : (
        selectedProject && (
          <DeviceConnectionsProvider
            key={selectedProject.id}
            initialDevices={selectedProject.devices?.map((d: Device) => d.ipAddress) || []}
            autoConnect={true}
            autoReconnect={true}
          >
            <Card>
              <div className="flex flex-start">
                <CardHeader>
                  <Button
                    variant="ghost"
                    className="px-0 py-0 text-left text-lg sm:text-xl font-semibold flex items-center gap-2"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <span>{selectedProject?.name || 'Select Project'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {menuOpen && (
                    <div className="absolute left-0 mt-2 bg-popover border rounded shadow-lg z-20 w-64">
                      <div className="flex flex-col p-2 max-h-64 overflow-auto">
                        {localProjects.map((project) => (
                          <Button
                            key={project.id}
                            variant={selectedProjectId === project.id ? 'default' : 'ghost'}
                            className="justify-start w-full"
                            onClick={() => {
                              setSelectedProjectId(project.id)
                              setMenuOpen(false)
                            }}
                          >
                            {project.name}
                          </Button>
                        ))}
                        {localProjects.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">No projects</div>
                        )}
                      </div>

                      <div className="flex gap-2 p-2 border-t">
                        <Input
                          placeholder="Add new..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={() => {
                            handleCreateProject()
                          }}
                          disabled={isPending || !newProjectName}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <CardDescription className="text-xs sm:text-sm mt-1 pl-3">
                    {selectedProject?.gameMode?.name || 'Standard'}
                  </CardDescription>
                </CardHeader>
              </div>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="w-full sm:w-auto justify-start">
                    <TabsTrigger value="overview" className="group flex-1 sm:flex-none">
                      <LayoutDashboard className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline group-data-[state=active]:inline">
                        Overview
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="devices" className="group flex-1 sm:flex-none">
                      <Monitor className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline group-data-[state=active]:inline">
                        Devices
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="group flex-1 sm:flex-none">
                      <Users className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline group-data-[state=active]:inline">
                        Teams
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="players" className="group flex-1 sm:flex-none">
                      <Gamepad2 className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline group-data-[state=active]:inline">
                        Players
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="project" className="group flex-1 sm:flex-none">
                      <Settings className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline group-data-[state=active]:inline">
                        Settings
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <GameOverview project={selectedProject} />
                  </TabsContent>

                  <TabsContent value="devices" className="mt-4">
                    <ProjectDeviceManager
                      project={selectedProject}
                      availableDevices={availableDevices}
                    />
                  </TabsContent>

                  <TabsContent value="teams" className="mt-4">
                    <TeamManager project={selectedProject} />
                  </TabsContent>

                  <TabsContent value="players" className="mt-4">
                    <PlayerManager
                      project={selectedProject}
                      devices={selectedProject.devices || []}
                    />
                  </TabsContent>

                  <TabsContent value="project" className="mt-4">
                    <ProjectSettingsManager
                      project={selectedProject}
                      gameModes={gameModes}
                      onDeleteAction={() => handleDeleteProject(selectedProject.id)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </DeviceConnectionsProvider>
        )
      )}
    </div>
  )
}
