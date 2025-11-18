import { AboutView } from "@/components/views/about-view";
import { getVaultInfo } from "@/lib/vault/repository";

export default function AboutPage() {
  const vault = getVaultInfo();
  return <AboutView noteCount={vault.noteCount} />;
}
