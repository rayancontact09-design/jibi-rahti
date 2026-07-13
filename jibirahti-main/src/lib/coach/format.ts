/** Replaces every `{token}` in `template` with `params[token]`, if provided. */
export function formatCoachText(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return Object.entries(params).reduce((s, [key, value]) => s.split(`{${key}}`).join(value), template);
}
