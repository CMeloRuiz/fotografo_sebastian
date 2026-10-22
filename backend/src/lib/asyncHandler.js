/**
 * Express 4 no captura los rechazos de una funcion async, asi que un await
 * que falle dejaria la peticion colgada. Esto los reenvia al errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
