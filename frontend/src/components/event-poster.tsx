"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";

const FALLBACK_ASPECT_RATIO = 16 / 9;

type EventPosterProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export function EventPoster({ src, alt, priority = false }: EventPosterProps) {
  const { t } = useLanguage();
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setAspectRatio(FALLBACK_ASPECT_RATIO);
    setHasLoadError(false);
  }, [src]);

  return (
    <div className="container max-w-screen-2xl pt-6 sm:pt-8 md:pt-10">
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/40 bg-muted/20"
        style={{ aspectRatio }}
      >
        {hasLoadError ? (
          <div
            className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground"
            role="img"
            aria-label={alt}
          >
            {t("event.posterUnavailable")}
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc(100vw - 32px), 1152px"
            className="object-contain"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth > 0 && naturalHeight > 0) {
                setAspectRatio(naturalWidth / naturalHeight);
              }
            }}
            onError={() => setHasLoadError(true)}
          />
        )}
      </div>
    </div>
  );
}
