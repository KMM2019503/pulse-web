"use client";

import { useParams } from "next/navigation";
import { PublicProfileScreen } from "@/components/profile/public-profile-screen";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  return <PublicProfileScreen userId={params.userId} />;
}
