import { Database } from 'better-sqlite3';
import { Express } from 'express';
import nodemailer from 'nodemailer';

interface AuthRequest {
  user?: { sub: string };
}

export const setupAlertWorker = (db: Database) => {
  // Email transporter (configure with env vars)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });

  // Check alerts every 30 seconds
  setInterval(() => {
    try {
      const alerts = db.prepare('SELECT * FROM alerts WHERE enabled = 1').all() as any[];
      
      alerts.forEach(alert => {
        // Get latest metric value for this alert
        const metric = db.prepare(
          'SELECT AVG(value) as avg_value FROM metrics WHERE metric_name = ? ORDER BY created_at DESC LIMIT 100'
        ).get(alert.name) as any;

        if (metric && metric.avg_value >= alert.threshold) {
          // Alert triggered
          const msg = `Alert "${alert.name}" triggered: value ${metric.avg_value} >= threshold ${alert.threshold}`;
          
          // Send email
          if (process.env.SMTP_USER) {
            transporter.sendMail({
              from: 'alerts@forge.app',
              to: process.env.ALERT_EMAIL || 'admin@forge.app',
              subject: `🚨 Alert: ${alert.name}`,
              text: msg,
              html: `<strong>${msg}</strong>`
            }).catch(e => console.error('Email send failed:', e));
          }

          // Call webhook if configured
          if (alert.webhook_url) {
            fetch(alert.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alert_id: alert.id,
                alert_name: alert.name,
                threshold: alert.threshold,
                value: metric.avg_value,
                timestamp: new Date().toISOString()
              })
            }).catch(e => console.error('Webhook call failed:', e));
          }

          // Log alert trigger
          db.prepare(
            'INSERT INTO alert_logs (id, alert_id, triggered_at, value) VALUES (?, ?, datetime(?), ?)'
          ).run(require('uuid').v4(), alert.id, Date.now() / 1000, metric.avg_value);
        }
      });
    } catch (e) {
      console.error('Alert worker error:', e);
    }
  }, 30000);
};
