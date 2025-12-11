'use client'

import { useState, useTransition } from 'react'
import { createProject, deleteProject } from '@/features/projects/actions'
import { Gamepad2, Monitor, Plus, Settings, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
        <div className="w-full md:w-64 flex flex-col gap-2">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <CardDescription>Game Mode: {selectedProject.gameMode.name}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="teams">
                    <TabsList>
                      <TabsTrigger value="teams">
                        <Users className="w-4 h-4 mr-2" /> Teams
                      </TabsTrigger>
                      <TabsTrigger value="players">
                        <Gamepad2 className="w-4 h-4 mr-2" /> Players
                      </TabsTrigger>
                      <TabsTrigger value="devices">
                        <Monitor className="w-4 h-4 mr-2" /> Devices
                      </TabsTrigger>
                      <TabsTrigger value="project">
                        <Settings className="w-4 h-4 mr-2" /> Project
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="teams" className="space-y-4 mt-4">
                      <TeamManager project={selectedProject} />
                    </TabsContent>

                    <TabsContent value="players" className="space-y-4 mt-4">
                      <PlayerManager project={selectedProject} devices={availableDevices} />
                    </TabsContent>

                    <TabsContent value="devices" className="space-y-4 mt-4">
                      <ProjectDeviceManager
                        project={selectedProject}
                        availableDevices={availableDevices}
                      />
                    </TabsContent>

                    <TabsContent value="project" className="space-y-4 mt-4">
                      <ProjectSettingsManager
                        project={selectedProject}
                        gameModes={gameModes}
                        onDelete={() => handleDeleteProject(selectedProject.id)}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  )
}
