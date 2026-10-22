# Galería de ejemplo con IA — guion listo para ejecutar

Este documento queda preparado para el día que decidas llenar el portafolio con
imágenes de muestra. **Nada de esto se ha ejecutado todavía**: no se gastó ni un
crédito.

## Por qué hace falta

Las fotos de los cinco álbumes del sitio antiguo (Daniela, Dayana, Jimena y
Alejandro, Juan José, Michelle) son privadas de cada cliente y no se migraron.
Hasta que Sebastián suba sus propias fotos desde el panel —con permiso de sus
clientes— el portafolio está vacío. Estas imágenes de muestra sirven para
enseñarle cómo se verá, y se reemplazan en cuanto tenga material propio.

## Regla que no se rompe

Las fotos de la **lista B** (`images/portafolio/` e `images/categories/`) **no se
suben a Higgsfield ni a ningún servicio externo**, ni como referencia. Las
imágenes de muestra se generan desde cero con personas ficticias. Si algún día
se usan referencias, solo pueden ser de la **lista A** (hero, retratos del
fotógrafo, fotos de servicios).

## Costes verificados (22 de octubre de 2026)

Consultados con `get_cost`, sin lanzar ninguna generación:

| Concepto | Modelo | Créditos |
|---|---|---|
| Imagen fotorrealista | `gpt_image_2_5` | 0,25 |
| Imagen alta calidad 2K | `soul_2` | 1,00 |
| Video 5 s 720p | `grok_video_v15_lite` | 5,00 |
| Video 5 s sin audio | `kling3_0` (std) | 7,50 |
| Video 5 s | `seedance_2_5` | 35,00 |

Saldo en ese momento: **8,95 créditos**, plan gratuito.

## Plan recomendado — 32 imágenes, 8,00 créditos

Cuatro álbumes de ocho fotos. Las portadas de las seis categorías del home
salen de estas mismas imágenes, sin coste adicional.

Modelo: `gpt_image_2_5` · relación de aspecto `3:4` para verticales y `4:3`
para horizontales · 0,25 créditos por imagen.

### Base de estilo común

Pega esto delante de cada prompt para que los cuatro álbumes se vean del mismo
fotógrafo y no de cuatro bancos de imágenes distintos:

> Fotografía documental de evento social, luz natural cálida de tarde,
> tonos tierra y verdes suaves, grano fino de película, profundidad de campo
> amplia, sin poses rígidas, sin marcas de agua, sin texto.

### Álbum 1 — Matrimonio (8 imágenes)

1. Los novios de la mano caminando por un sendero de campo, de espaldas, hora dorada. `3:4`
2. Detalle de las manos con los anillos sobre el ramo de flores blancas. `4:3`
3. La novia riéndose mientras le acomodan el velo, interior con ventana grande. `3:4`
4. Primer baile en una pista con luces cálidas colgantes, movimiento suave. `4:3`
5. Mesa de recepción vestida, platos y flores, luz de atardecer. `4:3`
6. Invitados aplaudiendo de pie en la ceremonia, vistos desde atrás. `4:3`
7. Retrato del novio ajustándose los gemelos frente a un espejo. `3:4`
8. Brindis con copas en alto al anochecer, luces de bombillas al fondo. `4:3`

### Álbum 2 — Quince años (8 imágenes)

1. Quinceañera con vestido largo azul en unas escaleras de piedra, hora dorada. `3:4`
2. Detalle de los zapatos y la corona sobre una silla antigua. `4:3`
3. El vals con su padre, pista con luces cálidas, movimiento. `4:3`
4. Retrato cercano riéndose, pelo al viento, exteriores. `3:4`
5. Decoración de la mesa principal con globos y flores. `4:3`
6. Grupo de amigas en la pista de baile, flash directo, ambiente de fiesta. `4:3`
7. Torta de celebración iluminada con velas. `3:4`
8. La quinceañera de espaldas mirando el salón vacío antes de entrar. `3:4`

### Álbum 3 — Bautizo (8 imágenes)

1. Bebé en brazos de su madre junto a la pila bautismal, luz de vitral. `3:4`
2. Detalle de las manos del sacerdote sobre la cabeza del bebé. `4:3`
3. Familia reunida en el atrio de la iglesia, retrato de grupo relajado. `4:3`
4. Vestido de bautizo colgado junto a una ventana. `3:4`
5. Abuela sosteniendo al bebé, primer plano de manos. `4:3`
6. Vela de bautizo encendida sobre el altar. `3:4`
7. Celebración familiar en casa, mesa larga al aire libre. `4:3`
8. Bebé dormido sobre una manta blanca tejida. `4:3`

### Álbum 4 — Evento musical (8 imágenes)

1. Cantante en el escenario con contraluz y humo, plano medio. `3:4`
2. Público con las manos en alto visto desde el escenario. `4:3`
3. Detalle de manos sobre las cuerdas de una guitarra eléctrica. `4:3`
4. Baterista en acción, obturación lenta con movimiento. `4:3`
5. Backstage: músico afinando antes de salir, luz tenue. `3:4`
6. Luces de escenario barriendo la sala, plano general. `4:3`
7. Retrato del vocalista sudado entre canciones, flash directo. `3:4`
8. Mesa de sonido y silueta del técnico. `4:3`

## Cómo ejecutarlo

### Con el conector de Higgsfield (recomendado)

Las 32 imágenes se mandan en lotes de 12 con `generate_image_batch`, se espera
con `jobs_wait` y se descargan los resultados. Son tres lotes.

### A mano, desde higgsfield.ai

1. Entra a tu cuenta y elige el modelo **GPT Image 2.5**.
2. Para cada imagen: pega la base de estilo, luego el prompt del listado, y
   elige la relación de aspecto indicada.
3. Descarga cada resultado en calidad máxima.

### Cómo entran al sitio

Hay dos caminos, los dos válidos:

**Por el panel (más simple).** Entra a `/admin`, crea un álbum por cada bloque,
y sube sus imágenes arrastrándolas. El pipeline de `sharp` genera solas las
versiones AVIF/WebP, la miniatura y el placeholder. Después marca cada álbum
como *demo* desde la base de datos si quieres que lleve el aviso de ejemplo:

```sql
update albums set is_demo = true where slug like '%-ejemplo';
update photos set is_demo = true
  where album_id in (select id from albums where is_demo);
```

**Por el seed (reproducible).** Deja las imágenes en una carpeta, genera
`backend/db/demo-albums.json` con la forma que espera `db/seed.js` y ejecuta
`npm run seed` en `backend/`. El seed las marca `is_demo = true` solo.

## Lo que decidimos no hacer, y por qué

**Upscale de las imágenes públicas.** No hacía falta. El hero original es de
3892×5838 px, el retrato de 2881×4322 y las fotos de servicios llegan a
7900×5274. Ninguna es de baja resolución: el problema nunca fue la calidad
sino que se servían sin optimizar, y eso ya está resuelto en el pipeline.

**Video del hero y reel vertical con IA.** Un loop generado con personas
ficticias como portada de un fotógrafo real juega en su contra: su hero actual
es una foto suya buena, y eso convence más. El reel vertical, además, es
material para Instagram, no para el sitio. Si algún día se hacen, deben partir
de las imágenes de la lista A o de las de muestra, nunca de fotos de clientes.
