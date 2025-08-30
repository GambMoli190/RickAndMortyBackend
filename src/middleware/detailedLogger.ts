import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithLogging extends Request {
  startTime?: number;
  requestId?: string;
}

interface ResponseWithLogging extends Response {
  originalSend?: Function;
  responseBody?: any;
}

export const detailedLoggingMiddleware = (
  req: RequestWithLogging,
  res: ResponseWithLogging,
  next: NextFunction
): void => {
  // Generar ID único para el request
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Capturar información del request
  const requestInfo = {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    headers: {
      userAgent: req.get('User-Agent') || 'unknown',
      contentType: req.get('Content-Type') || 'none',
      contentLength: req.get('Content-Length') || 'unknown',
      authorization: req.get('Authorization') ? '[REDACTED]' : 'none',
      referer: req.get('Referer') || 'none',
      origin: req.get('Origin') || 'none',
      host: req.get('Host') || 'none',
    },
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    protocol: req.protocol,
    secure: req.secure,
    body: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
      ? sanitizeBody(req.body)
      : undefined
  };

  console.log('\n=== INCOMING REQUEST ===');
  console.log(`[${requestInfo.requestId}] ${requestInfo.method} ${requestInfo.url}`);
  console.log(`Timestamp: ${requestInfo.timestamp}`);
  console.log(`IP: ${requestInfo.ip}`);
  console.log(`User-Agent: ${requestInfo.headers.userAgent}`);
  console.log(`Content-Type: ${requestInfo.headers.contentType}`);

  if (Object.keys(requestInfo.query).length > 0) {
    console.log(`Query Parameters:`, requestInfo.query);
  }

  if (Object.keys(requestInfo.params).length > 0) {
    console.log(`Route Parameters:`, requestInfo.params);
  }

  if (requestInfo.body && Object.keys(requestInfo.body).length > 0) {
    console.log(`Request Body:`, requestInfo.body);
  }

  console.log('========================\n');

  // Interceptar la respuesta
  const originalSend = res.send;
  res.originalSend = originalSend;

  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = req.startTime ? endTime - req.startTime : 0;

    // Capturar información de la respuesta
    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      responseSize: getResponseSize(data),
      headers: {
        contentType: res.get('Content-Type') || 'unknown',
        contentLength: res.get('Content-Length') || 'unknown',
      }
    };

    // Log de respuesta
    console.log('\n=== OUTGOING RESPONSE ===');
    console.log(`[${responseInfo.requestId}] ${requestInfo.method} ${requestInfo.url}`);
    console.log(`Status: ${responseInfo.statusCode} ${responseInfo.statusMessage}`);
    console.log(`Duration: ${responseInfo.duration}`);
    console.log(`Response Size: ${responseInfo.responseSize}`);
    console.log(`Content-Type: ${responseInfo.headers.contentType}`);

    // Log del body de respuesta solo para requests específicos
    if (shouldLogResponseBody(req.path, res.statusCode)) {
      const sanitizedData = sanitizeResponseBody(data);
      if (sanitizedData) {
        console.log(`Response Body: ${JSON.stringify(sanitizedData, null, 2)}`);
      }
    }

    // Log de errores
    if (res.statusCode >= 400) {
      console.log(`ERROR RESPONSE for [${req.requestId}]:`, {
        method: requestInfo.method,
        url: requestInfo.url,
        statusCode: res.statusCode,
        ip: requestInfo.ip,
        userAgent: requestInfo.headers.userAgent,
        duration: responseInfo.duration
      });
    }

    console.log('========================\n');

    // Llamar al método original
    return originalSend.call(this, data);
  };

  next();
};

function sanitizeBody(body: any): any {
  if (!body) return body;

  const sanitized = { ...body };

  // Redactar campos sensibles
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

function sanitizeResponseBody(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data.length > 200 ? data.substring(0, 200) + '...' : data;
    }
  }
  return data;
}

function getResponseSize(data: any): string {
  if (!data) return '0 bytes';

  const size = typeof data === 'string'
    ? Buffer.byteLength(data, 'utf8')
    : Buffer.byteLength(JSON.stringify(data), 'utf8');

  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function shouldLogResponseBody(path: string, statusCode: number): boolean {
  // No loggear body para endpoints grandes o de assets
  const skipPaths = ['/health', '/assets', '/static'];
  if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
    return false;
  }

  // Solo loggear errores y respuestas pequeñas
  return statusCode >= 400 || path.includes('/graphql');
}