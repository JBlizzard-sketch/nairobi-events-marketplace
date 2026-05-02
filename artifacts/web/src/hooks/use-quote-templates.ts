import { useState, useCallback } from "react";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  lineItems: QuoteLineItem[];
  inclusions: string;
  exclusions: string;
  terms: string;
  depositPercent: number;
  createdAt: string;
}

const KEY = "nairobi_quote_templates_v1";

function load(): QuoteTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(templates: QuoteTemplate[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {}
}

export function useQuoteTemplates() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>(load);

  const saveTemplate = useCallback(
    (tpl: Omit<QuoteTemplate, "id" | "createdAt">) => {
      const next: QuoteTemplate[] = [
        ...templates,
        { ...tpl, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ];
      persist(next);
      setTemplates(next);
    },
    [templates],
  );

  const removeTemplate = useCallback(
    (id: string) => {
      const next = templates.filter((t) => t.id !== id);
      persist(next);
      setTemplates(next);
    },
    [templates],
  );

  return { templates, saveTemplate, removeTemplate };
}
