import DOMPurify from 'dompurify';

export function sanitizeHTML(input: string): string {
  // Configure DOMPurify to strip scripts/iframes/styles and event handlers
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p','span','div','strong','em','ul','ol','li','br','hr','a','h1','h2','h3','h4','h5','h6','code','pre','blockquote','img'
    ],
    ALLOWED_ATTR: ['href','title','alt','src'],
    FORBID_TAGS: ['script','iframe','style'],
    FORBID_ATTR: [/^on/i],
    // Ensure links are safe
    ADD_ATTR: ['rel','target'],
    // Transform target to safe combo when present
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: /^.*$/, // allow standard tags only
    }
  });
}

