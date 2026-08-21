import type { ImgHTMLAttributes } from "react";

interface Props extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "width" | "height"
> {
  src: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

function variantUrl(src: string, width: number) {
  const match = src.match(/-\d+w\.webp(\?.*)?$/i);
  if (!match) return null;
  return src.replace(match[0], `-${width}w.webp${match[1] ?? ""}`);
}

function webpSrcSet(src: string) {
  const urls = [400, 800]
    .map((width) => {
      const url = variantUrl(src, width);
      return url ? `${url} ${width}w` : null;
    })
    .filter((value): value is string => Boolean(value));
  return urls.length > 0 ? urls.join(", ") : undefined;
}

/**
 * Product image renderer for CDN/object-storage URLs.
 * It only derives sibling URLs when the stored URL follows the `-800w.webp`
 * convention, so external or legacy image URLs are never guessed.
 */
export function ResponsiveProductImage({
  src,
  alt,
  width = 800,
  height = 800,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  className,
  ...props
}: Props) {
  const srcSet = webpSrcSet(src);
  const fallback = variantUrl(src, 800) ?? src;

  return (
    <picture className="block h-full w-full">
      {srcSet ? <source type="image/webp" srcSet={srcSet} sizes={sizes} /> : null}
      <img
        {...props}
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
