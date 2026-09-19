// Small-picture URLs for lists. A phone showing a 44px thumbnail must not download the 3000px original.
//  - Cloudinary photos: ask Cloudinary itself for a small cropped, compressed copy (a few KB) and skip
//    Next's image proxy, which would only add another hop.
//  - Photos in /public (and anything else): go through Next's image optimizer (resized + WebP, cached).
export interface ThumbSource { src: string; unoptimized: boolean }

export function thumbSource(url: string, size = 96): ThumbSource {
  if (/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url)) {
    // don't stack a second transformation on top of one that is already there
    const already = /\/upload\/(?:[a-z]{1,3}_[^/,]+,?)+\//i.test(url);
    if (!already) {
      return {
        src: url.replace('/upload/', `/upload/c_fill,g_auto,w_${size},h_${size},q_auto,f_auto/`),
        unoptimized: true,
      };
    }
    return { src: url, unoptimized: true };
  }
  const local = url.startsWith('/') || /^https?:\/\//i.test(url) ? url : `/${url}`;
  return { src: local, unoptimized: false };
}
