import { redirect } from "next/navigation";

export default function LegacyAdminParticipantsPage() {
  redirect("/admin/participants/list");
}
