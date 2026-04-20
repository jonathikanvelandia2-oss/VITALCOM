import { sendEmail, type SendEmailResult } from './send'
import { renderWelcome, type WelcomeInput } from './templates/welcome'
import { renderPasswordReset, type PasswordResetInput } from './templates/password-reset'
import { renderOrderConfirmation, type OrderConfirmationInput } from './templates/order-confirmation'
import { renderEmailVerification, type EmailVerificationInput } from './templates/email-verification'
import { renderOrderStatusUpdate, type OrderStatusUpdateInput } from './templates/order-status-update'

// ── API de alto nivel — una función por tipo de email ──
// Cada helper acepta el "to" + los datos del template y llama
// sendEmail() con retry. Ninguno lanza excepción.

export async function sendWelcomeEmail(to: string, data: WelcomeInput): Promise<SendEmailResult> {
  const { subject, html, text } = renderWelcome(data)
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'type', value: 'welcome' }],
  })
}

export async function sendPasswordResetEmail(to: string, data: PasswordResetInput): Promise<SendEmailResult> {
  const { subject, html, text } = renderPasswordReset(data)
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'type', value: 'password_reset' }],
  })
}

export async function sendOrderConfirmationEmail(to: string, data: OrderConfirmationInput): Promise<SendEmailResult> {
  const { subject, html, text } = renderOrderConfirmation(data)
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: 'type', value: 'order_confirmation' },
      { name: 'order', value: data.orderNumber.replace(/[^a-z0-9_-]/gi, '_') },
    ],
  })
}

export async function sendEmailVerification(to: string, data: EmailVerificationInput): Promise<SendEmailResult> {
  const { subject, html, text } = renderEmailVerification(data)
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'type', value: 'email_verification' }],
  })
}

export async function sendOrderStatusUpdateEmail(to: string, data: OrderStatusUpdateInput): Promise<SendEmailResult> {
  const { subject, html, text } = renderOrderStatusUpdate(data)
  return sendEmail({
    to,
    subject,
    html,
    text,
    tags: [
      { name: 'type', value: 'order_status' },
      { name: 'status', value: data.status.toLowerCase() },
      { name: 'order', value: data.orderNumber.replace(/[^a-z0-9_-]/gi, '_') },
    ],
  })
}

export { sendEmail } from './send'
export type { SendEmailResult } from './send'
