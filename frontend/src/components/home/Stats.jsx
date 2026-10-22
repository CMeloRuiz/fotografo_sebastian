import { useEffect, useState } from 'react';
import useReveal from '../../hooks/useReveal';
import './Stats.css';

/**
 * Contador animado.
 *
 * El del sitio antiguo corria con requestAnimationFrame sumando un paso fijo
 * por cuadro, asi que duraba mas o menos en cada equipo. Este se apoya en el
 * reloj real y siempre termina en el tiempo previsto.
 */
function Counter({ value, duration = 1600, active }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return undefined;
    }

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Desaceleracion suave al final
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value, duration]);

  return <span>{display}</span>;
}

export default function Stats({ content }) {
  const [ref, isVisible] = useReveal({ threshold: 0.4 });

  return (
    <section className="stats" ref={ref}>
      <div className="container stats__grid">
        {content.stats.map((stat) => (
          <div className="stats__item" key={stat.label}>
            <p className="stats__number">
              <Counter value={stat.value} active={isVisible} />
              {stat.format === 'count' && <span className="stats__plus">+</span>}
            </p>
            <p className="stats__label">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
