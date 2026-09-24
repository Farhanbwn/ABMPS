/**
 * Escapes characters with special meaning in regular expressions to prevent ReDoS
 * and Regex Injection vulnerabilities when building MongoDB queries.
 */
export function escapeRegex(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
