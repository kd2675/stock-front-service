import { redirect } from "next/navigation";

export default function LegacyAdminParticipantsPage() {
  redirect("/supply-demand/admin/accounts/participants");
}
