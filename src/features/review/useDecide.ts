import { useState } from 'react';
import { api } from '../../api/claims';
import type { ApiError } from '../../api/client';
import type { AgentRef, DecisionAction, FieldValue } from '../../domain/types';

type Pending = Record<string, boolean>;
type Errors = Record<string, ApiError | undefined>;

/**
 * Sends decisions to the server and tracks saving and errors per field. Nothing
 * is shown as decided until the server says so: the next snapshot carries it.
 */
export function useDecide(claimId: string) {
  const [pending, setPending] = useState<Pending>({});
  const [errors, setErrors] = useState<Errors>({});

  /** `seen` is the AI run and version the reviewer was looking at when they decided. */
  async function decide(fieldId: string, action: DecisionAction, seen: AgentRef, value?: FieldValue) {
    setPending((p) => ({ ...p, [fieldId]: true }));
    setErrors((e) => ({ ...e, [fieldId]: undefined }));
    try {
      await api.decide(claimId, { field_id: fieldId, action, agent_run: seen.run, agent_version: seen.version, value });
      return true;
    } catch (error) {
      setErrors((e) => ({ ...e, [fieldId]: error as ApiError }));
      return false;
    } finally {
      setPending((p) => ({ ...p, [fieldId]: false }));
    }
  }

  return { decide, pending, errors };
}
