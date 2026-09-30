import Image, { type ImageProps } from "next/image";
import type { MediaRef } from "@/lib/supabase/media";

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height"> & { media: MediaRef; alt?: string };

/** Imatge del bucket de contingut. Els SVG es serveixen tal qual; la resta passen per l'optimitzador. */
export function MediaImage({ media, alt, fill, ...rest }: Props) {
  const svg = media.path.endsWith(".svg");
  const size = fill ? {} : { width: media.width ?? 64, height: media.height ?? 64 };
  return <Image src={media.src} alt={alt ?? media.alt} fill={fill} unoptimized={svg} {...size} {...rest} />;
}
