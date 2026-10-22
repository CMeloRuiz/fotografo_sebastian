import { useEffect, useRef, useState } from 'react';
import './SmartImage.css';

/**
 * La imagen del sitio. Todo lo que mostramos pasa por aqui.
 *
 * Recibe un descriptor con las variantes ya generadas (el manifiesto de
 * build para las imagenes del sitio, o la fila de la tabla photos para las
 * que sube el fotografo) y se encarga de:
 *   - servir AVIF, luego WebP, y JPEG como ultimo recurso
 *   - elegir el ancho correcto con srcset/sizes
 *   - reservar el espacio con width/height para que no haya saltos de layout
 *   - mostrar el LQIP borroso mientras carga y fundir a la foto real
 *
 * Solo el hero pasa priority; todo lo demas se carga en diferido.
 */
export default function SmartImage({
  image,
  alt,
  sizes = '100vw',
  priority = false,
  className = '',
  objectPosition,
  aspectRatio,
  rounded = false,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  // Una imagen que ya estaba en cache puede terminar de cargar antes de que
  // React enganche el onLoad; sin esto se quedaria borrosa para siempre.
  useEffect(() => {
    if (imgRef.current?.complete) setIsLoaded(true);
  }, []);

  if (!image) return null;

  const {
    lqip,
    fallback,
    avif = [],
    webp = [],
    width,
    height,
    alt: imageAlt,
  } = image;

  const srcSetOf = (list) => list.map((v) => `${v.url} ${v.w}w`).join(', ');
  const ratio = aspectRatio || (width && height ? `${width} / ${height}` : undefined);

  const classes = [
    'smart-image',
    isLoaded && 'is-loaded',
    rounded && 'smart-image--rounded',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        aspectRatio: ratio,
        backgroundImage: lqip ? `url("${lqip}")` : undefined,
      }}
    >
      <picture>
        {avif.length > 0 && <source type="image/avif" srcSet={srcSetOf(avif)} sizes={sizes} />}
        {webp.length > 0 && <source type="image/webp" srcSet={srcSetOf(webp)} sizes={sizes} />}
        <img
          ref={imgRef}
          src={fallback}
          alt={alt ?? imageAlt ?? ''}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          style={{ objectPosition }}
        />
      </picture>
    </div>
  );
}
