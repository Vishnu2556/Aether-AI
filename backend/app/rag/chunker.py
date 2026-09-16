from typing import List, Dict

class TextChunker:
    def __init__(self, chunk_size: int = 700, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str, metadata: dict = None) -> List[Dict]:
        """
        Splits text recursively using natural boundary separators.
        Returns list of dicts with `text`, `index`, and `metadata`.
        """
        if not text or not text.strip():
            return []

        clean_text = text.strip()
        separators = ["\n\n", "\n", ". ", " ", ""]
        raw_chunks = self._recursive_split(clean_text, separators, self.chunk_size)
        
        # Merge small chunks with overlap
        chunks = []
        for i, chunk in enumerate(raw_chunks):
            if not chunk.strip():
                continue
            chunks.append({
                "index": i,
                "text": chunk.strip(),
                "metadata": metadata or {}
            })
        return chunks

    def _recursive_split(self, text: str, separators: List[str], max_len: int) -> List[str]:
        if len(text) <= max_len:
            return [text]

        if not separators:
            # Hard split
            return [text[i:i + max_len] for i in range(0, len(text), max_len - self.chunk_overlap)]

        sep = separators[0]
        sub_separators = separators[1:]
        
        if sep == "":
            splits = list(text)
        else:
            splits = text.split(sep)

        chunks = []
        current = ""

        for part in splits:
            candidate = f"{current}{sep}{part}" if current else part
            if len(candidate) <= max_len:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                if len(part) > max_len:
                    chunks.extend(self._recursive_split(part, sub_separators, max_len))
                    current = ""
                else:
                    current = part

        if current:
            chunks.append(current)

        return chunks
