import { VaultEditorView } from "@/components/views/vault-editor-view";
import { getAllNoteSummaries, getAllNotes, getVaultInfo } from "@/lib/vault/repository";

export default function HomePage() {
  const vault = getVaultInfo();
  const notes = getAllNoteSummaries();
  const noteContents = getAllNotes();

  return (
    <VaultEditorView
      vaultName={vault.name}
      notes={notes}
      noteContents={noteContents}
    />
  );
}
