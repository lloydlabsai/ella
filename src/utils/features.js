/* ═══════════════════════════════════════════════════════════
   FEATURE EXTRACTION
   Structural and content features from post text
   ═══════════════════════════════════════════════════════════ */

export function extractFeatures(text) {
  const lines = text.split(/\n/).filter((l) => l.trim());
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const emojis = (text.match(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const hashtags = (text.match(/#\w+/g) || []).length;
  const mentions = (text.match(/@\w+/g) || []).length;
  const numbers = (text.match(/\d+%?/g) || []).length;
  const urls = (text.match(/https?:\/\/\S+/g) || []).length;
  const firstLine = lines[0] || "";
  const lastLine = lines[lines.length - 1] || "";
  const hasListFormat = /^[\s]*[-•*\d]/.test(text);
  const avgWordsPerLine = lines.length ? words.length / lines.length : 0;
  const shortParas = lines.filter((l) => l.split(/\s+/).length <= 8).length;

  return {
    char_count: text.length,
    word_count: words.length,
    line_count: lines.length,
    sentence_count: sentences.length,
    questions,
    exclamations,
    emojis,
    hashtags,
    mentions,
    numbers_used: numbers,
    urls,
    has_list: hasListFormat ? 1 : 0,
    avg_words_per_line: +avgWordsPerLine.toFixed(1),
    short_paragraphs: shortParas,
    short_para_ratio: +(shortParas / Math.max(lines.length, 1)).toFixed(2),
    first_line_length: firstLine.length,
    first_line_words: firstLine.split(/\s+/).length,
    last_line_has_question: /\?/.test(lastLine) ? 1 : 0,
    last_line_has_cta: /comment|share|tag|follow|agree|disagree|thoughts|think|what do you|let me know/i.test(lastLine) ? 1 : 0,
    hook_is_bold_claim: /^(most|every|nobody|the truth|here's what|stop|unpopular|hot take|controversial)/i.test(firstLine) ? 1 : 0,
    hook_is_story: /^(last|yesterday|i was|i just|when i|a few|this morning|three years)/i.test(firstLine) ? 1 : 0,
    hook_is_question: /\?/.test(firstLine) ? 1 : 0,
    hook_is_number: /^\d/.test(firstLine) ? 1 : 0,
    personal_pronouns: (text.match(/\b(i|my|me|we|our|us)\b/gi) || []).length,
    whitespace_ratio: +(text.split(/\n\n+/).length / Math.max(lines.length, 1)).toFixed(2),
  };
}
