import { useState, useEffect, useRef } from "react";
import { useClipboardStore } from "../../stores/clipboardStore";

import type { ClipboardRecord } from "../../types";

interface ImageThumbProps {
  record: ClipboardRecord;
  onClick: (e: React.MouseEvent) => void;
}

export function ImageThumb({ record, onClick }: ImageThumbProps) {
  const getThumbnail = useClipboardStore((s) => s.getThumbnail);
  const thumbnailCache = useClipboardStore((s) => s.thumbnailCache);
  const [src, setSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const cached = thumbnailCache[record.id];
    if (cached) {
      setSrc(cached);
      return;
    }
    getThumbnail(record).then((dataUrl) => {
      if (dataUrl) setSrc(dataUrl);
    });
  }, [visible, record.id]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="clipboard-card-thumb"
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt="" />
      ) : (
        <div className="thumb-spinner" />
      )}
    </div>
  );
}
