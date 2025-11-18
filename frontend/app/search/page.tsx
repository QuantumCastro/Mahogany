import { SearchView } from "@/components/views/search-view";
import { getAllNoteSummaries } from "@/lib/vault/repository";

export default function SearchPage() {
  const dataset = getAllNoteSummaries();
  return <SearchView dataset={dataset} />;
}
