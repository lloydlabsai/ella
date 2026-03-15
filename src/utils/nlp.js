/* ═══════════════════════════════════════════════════════════
   NLP UTILITIES
   Tokenization, TF-IDF, n-grams, stop words
   ═══════════════════════════════════════════════════════════ */

export const STOP_WORDS = new Set([
  "i","me","my","myself","we","our","ours","ourselves","you","your","yours",
  "yourself","yourselves","he","him","his","himself","she","her","hers",
  "herself","it","its","itself","they","them","their","theirs","themselves",
  "what","which","who","whom","this","that","these","those","am","is","are",
  "was","were","be","been","being","have","has","had","having","do","does",
  "did","doing","a","an","the","and","but","if","or","because","as","until",
  "while","of","at","by","for","with","about","against","between","through",
  "during","before","after","above","below","to","from","up","down","in",
  "out","on","off","over","under","again","further","then","once","here",
  "there","when","where","why","how","all","both","each","few","more","most",
  "other","some","such","no","nor","not","only","own","same","so","than",
  "too","very","s","t","can","will","just","don","should","now","d","ll",
  "m","o","re","ve","y","ain","aren","couldn","didn","doesn","hadn","hasn",
  "haven","isn","ma","mightn","mustn","needn","shan","shouldn","wasn",
  "weren","won","wouldn","also","get","got","like","know","think","would",
  "could","one","even","really","much","still","well","back","going","make",
  "see","way","new","us","go","come","take","many","want","said","im","ive",
  "dont","thats","youre","theyre","weve","hes","shes","its","lets","theres",
]);

export function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function getNgrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

export function computeTFIDF(docs) {
  const df = {};
  const N = docs.length;
  const tfs = docs.map((tokens) => {
    const tf = {};
    tokens.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
    const max = Math.max(...Object.values(tf), 1);
    Object.keys(tf).forEach((t) => (tf[t] /= max));
    return tf;
  });
  tfs.forEach((tf) => Object.keys(tf).forEach((t) => (df[t] = (df[t] || 0) + 1)));
  return tfs.map((tf) => {
    const tfidf = {};
    Object.keys(tf).forEach((t) => {
      tfidf[t] = tf[t] * Math.log(N / (df[t] || 1));
    });
    return tfidf;
  });
}

export function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx, yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
