import { Metadata } from "next";
import PrivacyManagementClient from "./PrivacyManagementClient";

export const metadata: Metadata = {
  title: "Privacidade e Dados Pessoais | Tech4Loop",
  description: "Gerencie seus dados pessoais conforme a LGPD",
};

export default function PrivacyManagementPage() {
  return <PrivacyManagementClient />;
}
