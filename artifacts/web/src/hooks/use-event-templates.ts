import { useState, useCallback } from "react";

export interface EventFormSnapshot {
  title: string;
  eventType: string;
  venue: string;
  city: string;
  guestCount: number;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  servicesNeeded: string[];
  isEmergency: boolean;
}

export interface EventTemplate {
  id: string;
  name: string;
  form: EventFormSnapshot;
  createdAt: string;
}

const KEY = "nairobi_event_templates_v1";

function load(): EventTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(templates: EventTemplate[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {}
}

export function useEventTemplates() {
  const [templates, setTemplates] = useState<EventTemplate[]>(load);

  const saveTemplate = useCallback(
    (name: string, form: EventFormSnapshot) => {
      const next: EventTemplate[] = [
        ...templates,
        { id: crypto.randomUUID(), name, form, createdAt: new Date().toISOString() },
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
