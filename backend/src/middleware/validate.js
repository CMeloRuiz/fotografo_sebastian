/**
 * Valida el cuerpo (o la query) contra un esquema de zod y reemplaza
 * req.body por el resultado ya saneado. Lo que llega del navegador nunca
 * se usa crudo.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Revisa los datos enviados.', details });
    }

    req[source] = result.data;
    return next();
  };
}

export default validate;
