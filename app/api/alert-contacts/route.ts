import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching alert contacts...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const { data, error } = await supabase.from("alert_contacts").select("*").order("name", { ascending: true })

    console.log("[v0] Query executed - data:", data, "error:", error)

    if (error) {
      console.error("[v0] Supabase error:", error)
      throw error
    }

    console.log("[v0] Returning contacts:", data?.length || 0)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching contacts:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("alert_contacts")
      .insert({
        name: body.name,
        phone_number: body.phone_number,
        active: body.active !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating contact:", error)
    return NextResponse.json({ error: "Error creating contact" }, { status: 500 })
  }
}
