/** Keep the new reply readable, with quoted history available on demand. */
export function prepareEmailBody(html: string | null, text: string | null) {
  if (!html || typeof DOMParser === 'undefined') {
    const content = text || ''
    const quote = content.search(/(?:^|\n)(?:On [^\n]{3,250}wrote:|>[^\n]|-{3,}\s*Original Message)/i)
    return { html: '', text: quote < 0 ? content : content.slice(0, quote).trimEnd(), quotedHtml: '', quotedText: quote < 0 ? '' : content.slice(quote) }
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select,video,audio,source,picture,img,svg,canvas,base,template').forEach(node => node.remove())
  // Only basic email formatting and explicit safe links survive. No remote
  // images, tracking pixels, event handlers, inline CSS, or embedded documents.
  const allowed = new Set(['P', 'DIV', 'SPAN', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'A', 'HR', 'TABLE', 'TBODY', 'TR', 'TD', 'TH'])
  const quotes = Array.from(doc.body.querySelectorAll('blockquote, .gmail_quote, .yahoo_quoted, .protonmail_quote'))
    .filter(node => !node.parentElement?.closest('blockquote, .gmail_quote, .yahoo_quoted, .protonmail_quote'))
  for (const node of Array.from(doc.body.querySelectorAll('*'))) {
    const href = node.tagName === 'A' ? node.getAttribute('href')?.trim() : null
    for (const attr of Array.from(node.attributes)) node.removeAttribute(attr.name)
    if (href && /^(https?:\/\/|mailto:|tel:)/i.test(href)) {
      node.setAttribute('href', href)
      node.setAttribute('rel', 'noreferrer noopener nofollow')
      node.setAttribute('target', '_blank')
    }
    if (!allowed.has(node.tagName)) node.replaceWith(...Array.from(node.childNodes))
  }
  const quotedHtml = quotes.map(node => node.innerHTML).join('<br>')
  quotes.forEach(node => node.remove())
  // If the provider sent only a quoted block, show it rather than an empty card.
  if (!doc.body.textContent?.trim() && quotedHtml) return { html: quotedHtml, text: '', quotedHtml: '', quotedText: '' }
  return { html: doc.body.innerHTML, text: '', quotedHtml, quotedText: '' }
}
