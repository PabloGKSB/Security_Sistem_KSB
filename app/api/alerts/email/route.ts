import { NextResponse } from "next/server"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY

const fromEmail = process.env.ALERTS_EMAIL_FROM

const toEmails = process.env.ALERTS_EMAIL_TO



const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: Request) {
  try {
  

    const body = await request.json().catch(() => ({} as any))
    const { subject, message, door_id, board_name, location, event_type } = body

    // ✅ Solo correo en open
    if (event_type && event_type !== "open") {
      return NextResponse.json({ ok: true, skipped: true, reason: "Solo eventos 'open'" })
    }

    // ✅ Si no hay config, no bloquea y no “falla”
    if (!resend || !fromEmail || !toEmails) {
      console.warn("[alerts/email] Email no configurado.")
      return NextResponse.json({ ok: true, skipped: true, reason: "Email no configurado" })
    }

    const eventLabel = (event_type || "open").toUpperCase()
    const loc = location || "Sin ubicación"

    const subjectFinal = subject || `Alerta puerta ${eventLabel} - ${loc}`
    const textFinal =
      message ||
      `Evento ${eventLabel} en ${loc}\nBoard: ${board_name || "N/A"}\nDoor ID: ${door_id || "N/A"}`

    const toList = toEmails.split(",").map((e) => e.trim()).filter(Boolean)

    await resend.emails.send({
      from: fromEmail,
      to: toList,
      subject: subjectFinal,
      text: textFinal,
    })

    return NextResponse.json({ ok: true, message: "Correo enviado." })
  } catch (error) {
    console.error("[alerts/email] Error:", error)
    return NextResponse.json({ ok: false, message: "Error enviando correo." }, { status: 500 })
  }
}