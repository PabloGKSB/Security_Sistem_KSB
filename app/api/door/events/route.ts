import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")

    let query = supabase.from("door_events").select("*").order("created_at", { ascending: false }).limit(200)

    if (location) {
      query = query.eq("location", location)
    }

    const { data, error } = await query

    if (error) {
      console.error("[poc] Error leyendo door_events:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("[poc] Error inesperado en /api/door/events:", error)
    return NextResponse.json([])
  }
}

