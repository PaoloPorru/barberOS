const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const templates = {
  appointmentConfirmed: (data) => ({
    subject: `✅ Appuntamento confermato — ${data.date}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden">
        <div style="background:#0a0a0a;padding:24px;text-align:center">
          <h1 style="color:#c9a84c;font-size:28px;margin:0;letter-spacing:3px">BARBEROS</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111;margin-top:0">Appuntamento Confermato! ✂️</h2>
          <p style="color:#555">Ciao <strong>${data.clientName}</strong>, il tuo appuntamento è stato confermato.</p>
          <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:20px;margin:20px 0">
            <p style="margin:4px 0"><strong>📅 Data:</strong> ${data.date}</p>
            <p style="margin:4px 0"><strong>🕐 Orario:</strong> ${data.time}</p>
            <p style="margin:4px 0"><strong>✂️ Barbiere:</strong> ${data.barberName}</p>
            <p style="margin:4px 0"><strong>💈 Servizio:</strong> ${data.serviceName}</p>
            <p style="margin:4px 0"><strong>💰 Prezzo:</strong> €${data.price}</p>
          </div>
          <p style="color:#888;font-size:13px">Per modificare o cancellare il tuo appuntamento accedi alla tua area personale.</p>
        </div>
        <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999">
          © BarberOS — Il tuo appuntamento, senza pensieri.
        </div>
      </div>
    `,
  }),

  appointmentCancelled: (data) => ({
    subject: `❌ Appuntamento cancellato — ${data.date}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0a0a0a;padding:24px;text-align:center">
          <h1 style="color:#c9a84c;font-size:28px;margin:0;letter-spacing:3px">BARBEROS</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111">Appuntamento Cancellato</h2>
          <p>Ciao <strong>${data.clientName}</strong>, il tuo appuntamento del <strong>${data.date} alle ${data.time}</strong> è stato cancellato.</p>
          <p style="color:#888;font-size:13px">Puoi prenotare un nuovo appuntamento quando vuoi dalla tua area personale.</p>
        </div>
      </div>
    `,
  }),

  appointmentReminder: (data) => ({
    subject: `⏰ Promemoria — Domani alle ${data.time}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <div style="background:#0a0a0a;padding:24px;text-align:center">
          <h1 style="color:#c9a84c;font-size:28px;margin:0;letter-spacing:3px">BARBEROS</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111">Ci vediamo domani! 💈</h2>
          <p>Ciao <strong>${data.clientName}</strong>, ti ricordiamo il tuo appuntamento di domani.</p>
          <div style="background:#f9f9f9;border-left:4px solid #c9a84c;padding:16px;margin:20px 0">
            <p style="margin:4px 0"><strong>📅</strong> ${data.date} alle <strong>${data.time}</strong></p>
            <p style="margin:4px 0"><strong>✂️</strong> ${data.barberName} — ${data.serviceName}</p>
          </div>
        </div>
      </div>
    `,
  }),
};

async function sendEmail(to, templateName, data) {
  const template = templates[templateName](data);
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    logger.info(`Email sent: ${templateName} → ${to}`);
  } catch (err) {
    logger.error(`Email failed: ${templateName} → ${to}`, err);
    throw err;
  }
}

module.exports = { sendEmail };
