// DEMO VERSION - Admin Cupons Desabilitado
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Gerenciar Cupons | Admin Tech4Loop",
  description: "Crie e gerencie cupons de desconto",
};

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  console.log("🔄 [DEMO] Admin cupons - autenticação desabilitada");
  redirect("/");
}
