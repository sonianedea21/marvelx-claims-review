import { useEffect, useRef, useState } from 'react';
import type { AgentRef, FieldState } from '../../domain/types';

/**
 * Field ids whose AI value changed while this screen was open. The marker stays
 * until the reviewer decides that field, so it never depends on an animation
 * (which reduced motion turns off) or on catching a brief flash.
 */
export function useRecentlyChanged(fields: FieldState[] | undefined): Set<string> {
  const versions = useRef<Map<string, AgentRef> | null>(null);
  const [changed, setChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!fields) return;
    const previous = versions.current;
    const next = new Map(fields.map((f) => [f.field_id, f.agent]));
    versions.current = next;
    if (!previous) return; // first snapshot: nothing "changed", it was already like this

    setChanged((current) => {
      const updated = new Set(current);
      for (const field of fields) {
        const before = previous.get(field.field_id);
        if (before && before.run === field.agent.run && field.agent.version > before.version) updated.add(field.field_id);
        // A decision made against the current version settles it.
        const { decision } = field;
        if (decision && decision.agent_run === field.agent.run && decision.agent_version === field.agent.version) {
          updated.delete(field.field_id);
        }
      }
      return updated;
    });
  }, [fields]);

  return changed;
}
