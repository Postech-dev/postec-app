export interface EmailNotificationPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL NOTIFICATION (Simulado / Sem RESEND_API_KEY)]`);
    console.log(`Para: ${payload.to}`);
    console.log(`Assunto: ${payload.subject}`);
    console.log(`Mensagem: ${payload.text}`);
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'PosTec <onboarding@resend.dev>',
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html || `<p>${payload.text.replace(/\n/g, '<br/>')}</p>`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Falha no envio do Resend:', errorText);
      return false;
    }

    console.log(`[EMAIL ENVIADO COM SUCESSO VIA RESEND] Para: ${payload.to}`);
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao Resend:', error);
    return false;
  }
}
