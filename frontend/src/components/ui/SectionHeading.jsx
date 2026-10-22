import Reveal from './Reveal';
import './SectionHeading.css';

/** Encabezado de seccion: volanta, titulo y bajada opcional. */
export default function SectionHeading({ eyebrow, title, lead, align = 'center', as: Tag = 'h2' }) {
  return (
    <Reveal className={`section-heading section-heading--${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="section-heading__title">{title}</Tag>
      {lead && <p className="lead section-heading__lead">{lead}</p>}
    </Reveal>
  );
}
