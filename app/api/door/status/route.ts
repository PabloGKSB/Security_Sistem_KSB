import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("door_status")
      .select("*")
      .order("last_updated", { ascending: false })

    if (error) {
      console.error("[poc] Error leyendo door_status:", error)
      // Para la POC, devolvemos siempre un array aunque haya error
      return NextResponse.json([])
    }

    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("[poc] Error inesperado en /api/door/status:", error)
    // No exponemos 500 al ESP32; siempre array vacío
    return NextResponse.json([])
  }
}

