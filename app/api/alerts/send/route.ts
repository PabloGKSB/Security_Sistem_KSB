import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Iniciando envío de alertas SMS...")

    const supabase = await createClient()
    const { message, event_type, location, board_name } = await request.json()

    console.log("[v0] Datos recibidos:", { message, event_type, location, board_name })

    // Obtener contactos activos
    const { data: contacts, error } = await supabase.from("alert_contacts").select("*").eq("active", true)

    if (error) {
      console.error("[v0] Error obteniendo contactos (no bloqueante):", error)
      return NextResponse.json({
        success: false,
        message: "No se pudieron obtener contactos, pero el evento principal no se ve afectado",
        details: error.message,
        sent_to: 0,
        results: [],
      })
    }

    if (!contacts || contacts.length === 0) {
      console.log("[v0] No hay contactos activos")
      return NextResponse.json({
        message: "No hay contactos activos",
        sent_to: 0,
        results: [],
      })
    }

    console.log(`[v0] Enviando SMS a ${contacts.length} contactos...`)

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhone) {
      console.warn("[v0] Twilio no configurado. Se omite envío de SMS pero se responde éxito para la POC.")
      return NextResponse.json({
        success: false,
        message: "Twilio no configurado. Para la POC se omiten SMS sin considerar error.",
        missing: {
          accountSid: !accountSid,
          authToken: !authToken,
          twilioPhone: !twilioPhone,
        },
        sent_to: 0,
        total_contacts: contacts.length,
        unverified_count: 0,
        results: [],
      })
    }

    const results = []
    let successCount = 0
    let unverifiedCount = 0

    for (const contact of contacts) {
      try {
        console.log(`[v0] Enviando SMS a ${contact.name} (${contact.phone_number})...`)

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: contact.phone_number,
            From: twilioPhone,
            Body: message,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`[v0] SMS enviado exitosamente a ${contact.name}`)
          results.push({
            contact: contact.name,
            phone: contact.phone_number,
            status: "sent",
            sid: data.sid,
          })
          successCount++
        } else {
          console.error(`[v0] Error enviando SMS a ${contact.name}:`, data)
          const isUnverified = data.code === 21608
          if (isUnverified) {
            unverifiedCount++
          }
          results.push({
            contact: contact.name,
            phone: contact.phone_number,
            status: "failed",
            error: data.message,
            code: data.code,
            isUnverified,
          })
        }
      } catch (error) {
        console.error(`[v0] Error enviando SMS a ${contact.name}:`, error)
        results.push({
          contact: contact.name,
          phone: contact.phone_number,
          status: "error",
          error: String(error),
        })
      }
    }

    console.log(`[v0] Resultado final: ${successCount}/${contacts.length} SMS enviados`)
    if (unverifiedCount > 0) {
      console.log(`[v0] Números no verificados (Twilio Trial): ${unverifiedCount}`)
    }

    return NextResponse.json({
      success: true,
      message: "Alertas procesadas",
      sent_to: successCount,
      total_contacts: contacts.length,
      unverified_count: unverifiedCount,
      results,
    })
  } catch (error) {
    console.error("[v0] Error crítico en envío de alertas (no bloqueante para POC):", error)
    return NextResponse.json({
      success: false,
      message: "Error crítico enviando SMS. Para la POC se considera no bloqueante.",
      details: error instanceof Error ? error.message : String(error),
      sent_to: 0,
      total_contacts: 0,
      unverified_count: 0,
      results: [],
    })
  }
}
