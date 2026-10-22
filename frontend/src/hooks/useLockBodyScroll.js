import { useEffect } from 'react';

/**
 * Congela el scroll del documento mientras hay una capa encima (menu movil,
 * lightbox). Cuenta cuantas capas lo pidieron, para que cerrar una no
 * desbloquee el scroll si otra sigue abierta.
 */
let lockCount = 0;

export default function useLockBodyScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;

    lockCount += 1;
    document.body.classList.add('is-locked');

    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.classList.remove('is-locked');
    };
  }, [isLocked]);
}
