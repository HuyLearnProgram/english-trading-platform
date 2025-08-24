import React from "react";
import "../../styles/Figure.css";

/**
 * Hình minh hoạ trong bài viết
 * props:
 *  - src (string, required)
 *  - caption (string, optional)
 *  - alt (string, optional)
 */
export default function Figure({ src, caption, alt }) {
  if (!src) return null;
  return (
    <figure className="detail-figure">
      <img src={src} alt={alt || caption || "blog-image"} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
