"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Pencil, Trash2, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Contact {
  id: string
  name: string
  phone_number: string
  active: boolean
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({ name: "", phone_number: "", active: true })
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testMessage, setTestMessage] = useState("🔔 Mensaje de prueba del Sistema IoT de Seguridad")
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/alert-contacts")
      const data = await response.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching contacts:", error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingContact ? `/api/alert-contacts/${editingContact.id}` : "/api/alert-contacts"
      const method = editingContact ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchContacts()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("[v0] Error saving contact:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este contacto?")) return

    try {
      await fetch(`/api/alert-contacts/${id}`, { method: "DELETE" })
      await fetchContacts()
    } catch (error) {
      console.error("[v0] Error deleting contact:", error)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({ name: contact.name, phone_number: contact.phone_number, active: contact.active })
    setDialogOpen(true)
  }

  const handleSendTest = async () => {
    setSendingTest(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testMessage,
          event_type: "test",
          location: "Prueba",
          board_name: "Sistema",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const sent = data.results?.filter((r: any) => r.status === "sent").length || 0
        const failed = data.results?.filter((r: any) => r.status === "failed").length || 0
        const unverified = data.unverified_count || 0

        let resultMessage = `✅ Mensajes enviados: ${sent} | Fallidos: ${failed}`

        if (unverified > 0) {
          resultMessage += `\n\n⚠️ Cuenta Twilio en modo Trial: ${unverified} número(s) no verificado(s).\n\nPara resolver:\n1. Verifica números en: twilio.com/console/phone-numbers/verified\n2. O actualiza a cuenta de pago en: twilio.com/console/billing`
        }

        setTestResult(resultMessage)
      } else {
        setTestResult(`❌ Error: ${data.error || "No se pudo enviar"}`)
      }
    } catch (error) {
      console.error("[v0] Error sending test message:", error)
      setTestResult(`❌ Error al enviar mensaje de prueba`)
    } finally {
      setSendingTest(false)
    }
  }

  const resetForm = () => {
    setEditingContact(null)
    setFormData({ name: "", phone_number: "", active: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Contactos de Alertas</h1>
          <p className="text-muted-foreground mt-1">Gestión de números para recibir alertas SMS</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-500 flex items-center gap-2">⚠️ Información sobre Twilio Trial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Tu cuenta de Twilio está en modo <strong>Trial</strong>. Esto significa que:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Solo puedes enviar SMS a números de teléfono verificados</li>
              <li>Cada número debe ser verificado manualmente en la consola de Twilio</li>
            </ul>
            <div className="mt-4 p-3 bg-background rounded-md border">
              <p className="font-semibold mb-2">Para verificar un número:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-muted-foreground">
                <li>
                  Ve a:{" "}
                  <a
                    href="https://www.twilio.com/console/phone-numbers/verified"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    twilio.com/console/phone-numbers/verified
                  </a>
                </li>
                <li>Haz clic en "Verify a Number"</li>
                <li>Ingresa el número en formato +56XXXXXXXXX</li>
                <li>Completa el proceso de verificación</li>
              </ol>
            </div>
            <div className="mt-4 p-3 bg-background rounded-md border">
              <p className="font-semibold mb-2">Para actualizar a cuenta de pago:</p>
              <p className="text-muted-foreground">
                Ve a:{" "}
                <a
                  href="https://www.twilio.com/console/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  twilio.com/console/billing
                </a>{" "}
                y actualiza tu plan
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Tester de Mensajes SMS
            </CardTitle>
            <CardDescription>Envía un mensaje de prueba a todos los contactos activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="test-message">Mensaje de Prueba</Label>
                <Input
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Escribe un mensaje de prueba..."
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSendTest}
                  disabled={sendingTest || contacts.filter((c) => c.active).length === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendingTest ? "Enviando..." : "Enviar Mensaje de Prueba"}
                </Button>
                {contacts.filter((c) => c.active).length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay contactos activos para enviar mensajes</p>
                )}
              </div>
              {testResult && (
                <div
                  className={`p-3 rounded-md whitespace-pre-line ${testResult.includes("✅") ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-red-500/10 text-red-500 border border-red-500/30"}`}
                >
                  {testResult}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Contactos</CardTitle>
              <CardDescription>Números que recibirán alertas de seguridad por SMS</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Contacto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingContact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
                  <DialogDescription>Complete los datos del contacto para alertas SMS</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Número de Teléfono</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+56912345678"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Formato internacional: +56 seguido del número (9 dígitos)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="active">Contacto activo</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingContact ? "Actualizar" : "Crear"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando contactos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Número de Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay contactos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="font-mono">{contact.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant={contact.active ? "default" : "secondary"}>
                            {contact.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
