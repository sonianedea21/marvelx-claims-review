/**
 * What a reviewer can do about a failed run. The agent only reports an error
 * code and message, so this maps the codes we know to plain next steps and
 * falls back to "pass it on with this code" for anything else. Add codes here
 * as the agent team documents them.
 */
const KNOWN: Record<string, { cause: string; nextStep: string }> = {
  policy_service_unavailable: {
    cause: 'The policy system did not answer in time. This is usually temporary.',
    nextStep: 'Run the AI again in a few minutes. If it keeps failing, the policy system may be down: tell your team lead.',
  },
  document_unreadable: {
    cause: 'One of the documents could not be read, for example a blurry scan or a missing page.',
    nextStep: 'Ask the claimant for a clearer or complete copy, add it to the claim, then run the AI again.',
  },
};

export function failureGuidance(code: string, retryable: boolean) {
  return (
    KNOWN[code] ?? {
      cause: 'The AI reported a problem we have no specific advice for.',
      nextStep: retryable
        ? 'Run the AI again. If it fails the same way, pass this on with the error code below.'
        : 'Pass this on to your team lead or IT with the error code below. Running it again won’t help.',
    }
  );
}
