import { marked } from 'marked';
export async function parseMarkdown(value) {
    if (!value)
        return '';
    return await marked.parse(value);
}
