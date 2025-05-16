import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /api/test/echo
 * @desc    Echo back the request information for debugging
 * @access  Public
 */
router.get('/echo', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Echo endpoint is working',
    requestInfo: {
      headers: req.headers,
      ip: req.ip,
      method: req.method,
      path: req.path,
      query: req.query,
      protocol: req.protocol,
      secure: req.secure,
      hostname: req.hostname,
    }
  });
});

/**
 * @route   POST /api/test/echo-body
 * @desc    Echo back the request body for debugging
 * @access  Public
 */
router.post('/echo-body', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Echo body endpoint is working',
    receivedBody: req.body,
    requestInfo: {
      headers: req.headers,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      method: req.method,
      path: req.path,
    }
  });
});

/**
 * Handle OPTIONS requests explicitly for CORS preflight
 */
router.options('/*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.status(200).end();
});

export default router;
