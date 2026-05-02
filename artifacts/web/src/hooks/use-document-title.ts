import { useEffect } from "react";

const BASE = "Nairobi Events";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${BASE}`;
  }, [title]);
}
