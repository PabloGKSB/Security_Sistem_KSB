import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    console.log("[poc] Placeholder /api/alerts/email llamado", body)

    // Aquí en el futuro se podría integrar un proveedor de email (SendGrid, Resend, etc.)
    // Para la POC simplemente devolvemos éxito sin requerir variables de entorno.

    return NextResponse.json({
      ok: true,
      message: "Alerta de email simulada (placeholder POC). No se envió ningún correo real.",
    })
  } catch (error) {
    console.error("[poc] Error en /api/alerts/email (no bloqueante):", error)
    return NextResponse.json({
      ok: false,
      message: "Error en placeholder de email, ignorado para POC.",
    })
  }
}

