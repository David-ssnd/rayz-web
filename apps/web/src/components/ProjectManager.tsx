'use client'

import { useState, useTransition } from 'react'
import { createProject, deleteProject } from '@/features/projects/actions'
import { Gamepad2, LayoutDashboard, Monitor, Plus, Settings, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DeviceConnectionsProvider } from '@/lib/websocket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const handleCreateProject = () => {
    if (!newProjectName) return
    startTransition(async () => {
      const res = await createProject(newProjectName)
      if (res.success) {
        setNewProjectName('')
        setSelectedProjectId(res.project.id)
      }
    })
  }

  const handleDeleteProject = (id: string) => {
    if (!confirm('Are you sure?')) return
    startTransition(async () => {
      await deleteProject(id)
      if (selectedProjectId === id) setSelectedProjectId(null)
    })
  }

  if (!selectedProject && projects.length > 0) {
    setSelectedProjectId(projects[0].id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Project Sidebar - Fixed width */}
        <div className="w-full md:w-64 md:min-w-64 md:max-w-64 flex flex-col gap-2">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProjectId === project.id ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setSelectedProjectId(project.id)}
            >
              {project.name}
            </Button>
          ))}

          <div className="flex gap-2 mt-2 pt-2 border-t">
            <Input
              placeholder="New Project"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleCreateProject}
              disabled={isPending || !newProjectName}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No projects found. Create one to get started.
              </CardContent>
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
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">{selectedProject.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {selectedProject.gameMode?.name || 'Standard'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6">
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
      </div>
    </div>
  )
}
