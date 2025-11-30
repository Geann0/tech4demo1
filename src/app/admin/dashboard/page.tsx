// DEMO VERSION - Admin Dashboard Desabilitado
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  console.log(" [DEMO] Admin dashboard - autenticação desabilitada");
  redirect("/");
}
