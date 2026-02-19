"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, DoorOpen } from "lucide-react"

interface Stats {
  total_events: number
  open_events: number
  close_events: number
  open_doors: number
  avg_open_duration_seconds: number
}

export function StatsCards({ location }: { location?: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url =
          location && location !== "all" ? `/api/stats?location=${encodeURIComponent(location)}` : "/api/stats"
        const response = await fetch(url)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [location])

  if (loading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>
  }

  if (!stats) return null

  const openEvents = stats.open_events || 0
  const closeEvents = stats.close_events || 0
  const openDoors = stats.open_doors || 0
  const avgOpenDuration = stats.avg_open_duration_seconds || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_events}</div>
          <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aperturas</CardTitle>
          <DoorOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openEvents}</div>
          <p className="text-xs text-muted-foreground">Eventos de apertura registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(avgOpenDuration / 60)}m {avgOpenDuration % 60}s
          </div>
          <p className="text-xs text-muted-foreground">Tiempo promedio con puerta abierta</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Puertas Abiertas Ahora</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openDoors}</div>
          <p className="text-xs text-muted-foreground">Tableros con estado actual abierto</p>
        </CardContent>
      </Card>
    </div>
  )
}
