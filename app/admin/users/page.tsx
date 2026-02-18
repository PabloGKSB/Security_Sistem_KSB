"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

interface User {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  cargo: string
  departamento: string
  rfid_uid: string
  ubicaciones_autorizadas: string[]
  activo: boolean
}

const LOCATIONS = ["SANTIAGO CASA MATRIZ", "ANTOFAGASTA", "COQUIMBO", "CONCEPCION", "PUERTO MONTT"]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    cargo: "",
    departamento: "",
    rfid_uid: "",
    ubicaciones_autorizadas: [] as string[],
    activo: true,
  })

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/authorized-users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingUser ? `/api/authorized-users/${editingUser.id}` : "/api/authorized-users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchUsers()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("[v0] Error saving user:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    try {
      await fetch(`/api/authorized-users/${id}`, { method: "DELETE" })
      await fetchUsers()
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      cargo: user.cargo,
      departamento: user.departamento,
      rfid_uid: user.rfid_uid,
      ubicaciones_autorizadas: user.ubicaciones_autorizadas || [],
      activo: user.activo,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      cargo: "",
      departamento: "",
      rfid_uid: "",
      ubicaciones_autorizadas: [],
      activo: true,
    })
  }

  const toggleLocation = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      ubicaciones_autorizadas: prev.ubicaciones_autorizadas.includes(location)
        ? prev.ubicaciones_autorizadas.filter((l) => l !== location)
        : [...prev.ubicaciones_autorizadas, location],
    }))
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
          <h1 className="text-3xl font-bold">Usuarios Autorizados</h1>
          <p className="text-muted-foreground mt-1">Gestión de acceso con tarjetas RFID</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>Usuarios con acceso autorizado al sistema</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>Complete los datos del usuario autorizado</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+56912345678"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        value={formData.departamento}
                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rfid_uid">UID Tarjeta RFID</Label>
                    <Input
                      id="rfid_uid"
                      value={formData.rfid_uid}
                      onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value })}
                      placeholder="A1B2C3D4"
                      required
                    />
                  </div>

                  <div>
                    <Label>Ubicaciones Autorizadas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LOCATIONS.map((location) => (
                        <Badge
                          key={location}
                          variant={formData.ubicaciones_autorizadas.includes(location) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleLocation(location)}
                        >
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="activo">Usuario activo</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingUser ? "Actualizar" : "Crear"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>UID RFID</TableHead>
                    <TableHead>Ubicaciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.nombre} {user.apellido}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.cargo || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{user.rfid_uid}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.ubicaciones_autorizadas?.slice(0, 2).map((loc) => (
                              <Badge key={loc} variant="secondary" className="text-xs">
                                {loc.split(" ")[0]}
                              </Badge>
                            ))}
                            {user.ubicaciones_autorizadas?.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.ubicaciones_autorizadas.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.activo ? "default" : "secondary"}>
                            {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
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
