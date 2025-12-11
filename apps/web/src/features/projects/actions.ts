'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

import { prisma } from '@/lib/server/prisma'

// --- Projects ---

export async function getProjects() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      gameMode: true,
      teams: true,
      players: {
        include: {
          team: true,
          device: true,
        },
      },
      devices: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createProject(name: string, gameModeName: string = 'Standard') {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    // Ensure GameMode exists
    let gameMode = await prisma.gameMode.findUnique({ where: { name: gameModeName } })
    if (!gameMode) {
      gameMode = await prisma.gameMode.create({ data: { name: gameModeName } })
    }

    const project = await prisma.project.create({
      data: {
        name,
        userId: session.user.id,
        gameModeId: gameMode.id,
      },
    })

    revalidatePath('/control')
    return { success: true, project }
  } catch (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project' }
  }
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; gameModeId?: string; duration?: number }
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const project = await prisma.project.update({
      where: { id: projectId, userId: session.user.id },
      data,
    })
    revalidatePath('/control')
    return { success: true, project }
  } catch (error) {
    return { error: 'Failed to update project' }
  }
}

export async function getGameModes() {
  return prisma.gameMode.findMany()
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    await prisma.project.delete({
      where: { id: projectId, userId: session.user.id },
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete project' }
  }
}

// --- Teams ---

export async function addTeam(projectId: string, name: string, color: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    })
    if (!project) return { error: 'Project not found' }

    const team = await prisma.team.create({
      data: {
        name,
        color,
        projectId,
      },
    })
    revalidatePath('/control')
    return { success: true, team }
  } catch (error) {
    return { error: 'Failed to add team' }
  }
}

export async function updateTeam(teamId: string, data: { name?: string; color?: string }) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { project: true },
    })
    if (!team || team.project.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.team.update({
      where: { id: teamId },
      data,
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update team' }
  }
}

export async function removeTeam(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    // Verify ownership via project
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { project: true },
    })
    if (!team || team.project.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.team.delete({ where: { id: teamId } })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to remove team' }
  }
}

// --- Players ---

export async function addPlayer(projectId: string, name: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    })
    if (!project) return { error: 'Project not found' }

    const player = await prisma.player.create({
      data: {
        name,
        projectId,
      },
    })
    revalidatePath('/control')
    return { success: true, player }
  } catch (error) {
    return { error: 'Failed to add player' }
  }
}

export async function updatePlayer(playerId: string, data: { name?: string }) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { project: true },
    })
    if (!player || player.project.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.player.update({
      where: { id: playerId },
      data,
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update player' }
  }
}

export async function removePlayer(playerId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { project: true },
    })
    if (!player || player.project.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.player.delete({ where: { id: playerId } })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to remove player' }
  }
}

export async function updatePlayerTeam(playerId: string, teamId: string | null) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { project: true },
    })
    if (!player || player.project.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.player.update({
      where: { id: playerId },
      data: { teamId },
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update player team' }
  }
}

export async function updatePlayerDevice(playerId: string, deviceId: string | null) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { project: true },
    })
    if (!player || player.project.userId !== session.user.id) return { error: 'Unauthorized' }

    // If assigning a device, ensure it belongs to the user and is in the project (or add it to project?)
    // For now, let's assume the device must be in the project or just available.
    // Actually, the schema says Device has projectId.
    // If we assign a device to a player, the device should probably belong to the same project.

    if (deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: { profile: true },
      })
      if (!device || device.profile.userId !== session.user.id)
        return { error: 'Device not found or unauthorized' }

      // Auto-assign device to project if not already
      if (device.projectId !== player.projectId) {
        await prisma.device.update({
          where: { id: deviceId },
          data: { projectId: player.projectId },
        })
      }
    }

    await prisma.player.update({
      where: { id: playerId },
      data: { deviceId },
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to update player device' }
  }
}

// --- Devices in Project ---

export async function addDeviceToProject(projectId: string, deviceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    })
    if (!project) return { error: 'Project not found' }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { profile: true },
    })
    if (!device || device.profile.userId !== session.user.id) return { error: 'Device not found' }

    await prisma.device.update({
      where: { id: deviceId },
      data: { projectId },
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to add device to project' }
  }
}

export async function removeDeviceFromProject(deviceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { profile: true },
    })
    if (!device || device.profile.userId !== session.user.id) return { error: 'Unauthorized' }

    await prisma.device.update({
      where: { id: deviceId },
      data: { projectId: null, player: { disconnect: true } }, // Also disconnect from player
    })
    revalidatePath('/control')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to remove device from project' }
  }
}
