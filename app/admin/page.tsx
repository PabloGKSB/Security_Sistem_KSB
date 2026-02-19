import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al dashboard
              </Button>
            </Link>
            <UserNav />
          </div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Configuración del sistema y herramientas de mantención</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Contactos de Alertas</CardTitle>
              <CardDescription>Configurar números para recibir SMS</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/contacts">
                <Button className="w-full">Administrar Contactos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Reportes y Análisis</CardTitle>
              <CardDescription>Generar informes de uso y seguridad</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button className="w-full">Ver Reportes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Limpieza de Eventos</CardTitle>
              <CardDescription>Eliminar eventos antiguos de la base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/cleanup">
                <Button className="w-full bg-transparent" variant="outline">
                  Gestionar Limpieza
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
