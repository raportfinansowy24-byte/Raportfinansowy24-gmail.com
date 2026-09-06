import { marked } from 'marked';

export async function parseMarkdown(value: string): Promise<string> {
  if (!value) return '';
  return await marked.parse(value);
}
