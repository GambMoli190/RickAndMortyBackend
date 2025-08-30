import { Request, Response, NextFunction } from 'express';

export const graphqlTimingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Solo aplicar a requests GraphQL
  if (req.path !== '/graphql' || req.method !== 'POST') {
    return next();
  }

  const startTime = process.hrtime.bigint();

  // Extraer información de la query GraphQL
  const { query, variables, operationName } = req.body || {};

  if (query) {
    console.log('\n=== GRAPHQL QUERY START ===');
    console.log(`Operation: ${operationName || 'unnamed'}`);
    console.log(`Query: ${query.replace(/\s+/g, ' ').trim()}`);
    if (variables && Object.keys(variables).length > 0) {
      console.log(`Variables: ${JSON.stringify(variables)}`);
    }
    console.log('========================\n');
  }

  // Interceptar la respuesta usando múltiples métodos
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;

  let responseLogged = false;

  const logResponse = function(data?: any) {
    if (responseLogged) return;
    responseLogged = true;

    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convertir a ms

    console.log('\n=== GRAPHQL QUERY END ===');
    console.log(`Operation: ${operationName || 'unnamed'}`);
    console.log(`Execution Time: ${executionTime.toFixed(2)}ms`);
    console.log(`Status: ${res.statusCode}`);

    // Performance warnings
    if (executionTime > 1000) {
      console.log(`  SLOW QUERY WARNING: Query took ${executionTime.toFixed(2)}ms`);
    } else if (executionTime > 500) {
      console.log(`  Performance notice: Query took ${executionTime.toFixed(2)}ms`);
    }

    console.log('========================\n');
  };

  // Interceptar todos los métodos posibles de respuesta
  res.end = function(chunk?: any, encoding?: any) {
    logResponse(chunk);
    return originalEnd.call(this, chunk, encoding);
  };

  res.send = function(data: any) {
    logResponse(data);
    return originalSend.call(this, data);
  };

  res.json = function(obj: any) {
    logResponse(obj);
    return originalJson.call(this, obj);
  };

  next();
};