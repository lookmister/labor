import 'dotenv/config';
// Fix SSL cert issue on macOS in dev — not needed in production (Railway handles certs)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';
import laborersRouter from './routes/laborers.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/events', eventsRouter);
app.use('/api/laborers', laborersRouter);
app.use('/webhook', webhookRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

import { startExpiryWorker } from './lib/expiry.js';
startExpiryWorker();

// Debug: test SMS from production server
app.get('/api/test-sms', async (req, res) => {
  const { sendSms } = await import('./lib/sms.js');
  try {
    const result = await sendSms('+16198920160', 'Test from Railway server');
    res.json({ ok: true, result });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
