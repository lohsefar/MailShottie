# MailShottie 📧

A powerful email load testing tool built with Next.js.

<div align="center">
  <img src="http://s3.sauerbase.com/logos/mailshottie.png" alt="MailShottie Logo" width="400">
</div>

## Installation

```bash
# Using Bun
bun install

# Using npm
npm install

# Using pnpm
pnpm install
```

## Running

```bash
# Using Bun
bun dev

# Using npm
npm run dev

# Using pnpm
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Copy `.env.example` to `.env.local` and configure your SMTP settings:

```env
SMTP_HOST=mail.yourhost.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
SMTP_FROM="Your Name <noreply@yourdomain.com>"
SENDER_DOMAIN=yourdomain.com
DEFAULT_SENDER_EMAIL=loadtest@yourdomain.com
```

## Functionality

- **Burst Mode**: Send emails in large batches for stress testing
- **Rate-Limited Mode**: Control email sending rate (per second/minute) for realistic load simulation
- **HTML Email Generation**: Professional styled HTML emails
- **PDF Attachments**: Support for small, medium, and large PDF attachments
- **Custom Content**: Custom subject lines and body content
- **Random Sender Addresses**: Generate random sender addresses from a configurable domain
- **Real-Time Statistics**: Live dashboard with success/failure tracking, average send time, and current sending rate
- **Error Logging**: Detailed error reporting for failed emails
- **Test Management**: Start and stop tests with real-time progress monitoring
- **Dark/Light Theme**: Theme support for the UI
