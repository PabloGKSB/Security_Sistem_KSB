import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")

    // Obtener eventos recientes (tipo open/close)
    let eventsQuery = supabase.from("door_events").select("event_type, location, created_at")

    if (location && location !== "all") {
      eventsQuery = eventsQuery.eq("location", location)
    }

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) throw eventsError

    // Contar eventos por tipo
    let totalEvents = 0
    let openEvents = 0
    let closeEvents = 0

    events?.forEach((event) => {
      totalEvents++
      if (event.event_type === "open") openEvents++
      if (event.event_type === "close") closeEvents++
    })

    // Obtener estado actual de puertas para calcular cuántas están abiertas
    let statusQuery = supabase.from("door_status").select("is_open, location, event_start_time")

    if (location && location !== "all") {
      statusQuery = statusQuery.eq("location", location)
    }

    const { data: statuses, error: statusError } = await statusQuery

    if (statusError) throw statusError

    let openDoors = 0
    let totalDurationSeconds = 0
    let durationSamples = 0

    const now = new Date()

    statuses?.forEach((status) => {
      if (status.is_open) {
        openDoors++
        if (status.event_start_time) {
          const start = new Date(status.event_start_time)
          const diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000))
          totalDurationSeconds += diffSeconds
          durationSamples++
        }
      }
    })

    const avgOpenDurationSeconds = durationSamples > 0 ? Math.round(totalDurationSeconds / durationSamples) : 0

    return NextResponse.json({
      total_events: totalEvents,
      open_events: openEvents,
      close_events: closeEvents,
      open_doors: openDoors,
      avg_open_duration_seconds: avgOpenDurationSeconds,
    })
  } catch (error) {
    console.error("[poc] Error fetching stats:", error)
    return NextResponse.json(
      {
        total_events: 0,
        open_events: 0,
        close_events: 0,
        open_doors: 0,
        avg_open_duration_seconds: 0,
      },
    )
  }
}
