import { TagsView } from "@/components/views/tags-view";
import { getTagStats } from "@/lib/vault/repository";

export default function TagsPage() {
  const tags = getTagStats();
  return <TagsView tags={tags} />;
}
