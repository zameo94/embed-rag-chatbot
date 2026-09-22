import type { ChatSource } from "../api/types";

export interface SourcesProps {
  label: string;
  sources: ChatSource[];
}

export function Sources({ label, sources }: SourcesProps) {
  return (
    <div class="erc-sources">
      <span class="erc-sources__label">{label}</span>
      <ul>
        {sources.map((source) => (
          <li key={`${source.document_id}:${source.chunk_index}`}>{source.filename}</li>
        ))}
      </ul>
    </div>
  );
}
