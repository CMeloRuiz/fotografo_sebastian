import useReveal from '../../hooks/useReveal';
import './Reveal.css';

/**
 * Envuelve un bloque para que aparezca al entrar en pantalla.
 * El delay escalona los elementos de una misma rejilla.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  variant = 'up',
  className = '',
  ...rest
}) {
  const [ref, isVisible] = useReveal();

  const classes = ['reveal', `reveal--${variant}`, isVisible && 'is-visible', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={ref}
      className={classes}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
