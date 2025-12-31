# MailShottie 📧

A powerful email load testing tool built with Next.js, designed to help you test email delivery systems, SMTP servers, and email processing pipelines with ease.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19.2.3-blue)

## Features ✨

- **Multiple Testing Modes**
  - **Burst Mode**: Send emails in large batches for stress testing
  - **Rate-Limited Mode**: Control email sending rate (per second/minute) for realistic load simulation

- **Rich Email Content**
  - HTML email generation with professional styling
  - PDF attachment support (small, medium, large sizes)
  - Custom subject lines and body content
  - Random sender address generation

- **Real-Time Monitoring**
  - Live statistics dashboard
  - Success/failure tracking
  - Average send time metrics
  - Current sending rate display
  - Error logging and reporting

- **Flexible Configuration**
  - Environment-based SMTP configuration
  - Customizable sender domains
  - Configurable default sender addresses
  - Support for multiple SMTP ports (587, 465, etc.)

- **Modern UI**
  - Dark/light theme support
  - Responsive design
  - Real-time updates
  - Test management (start/stop)

## Getting Started 🚀

### Prerequisites

- Node.js 20+ or Bun
- An SMTP server (Gmail, SendGrid, AWS SES, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lohsefar/MailShottie.git
   cd MailShottie
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   
   # Or using yarn
   yarn install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your SMTP credentials:
   ```env
   SMTP_HOST=mail.yourhost.com
   SMTP_PORT=587
   SMTP_USER=your-email@domain.com
   SMTP_PASSWORD=your-password
   SMTP_FROM="Your Name <noreply@yourdomain.com>"
   SENDER_DOMAIN=yourdomain.com
   DEFAULT_SENDER_EMAIL=loadtest@yourdomain.com
   ```

4. **Run the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration 📝

### Environment Variables

All configuration is done through environment variables in `.env.local`:

#### SMTP Configuration (Required)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | - | ✅ |
| `SMTP_PORT` | SMTP port number | `587` | ❌ |
| `SMTP_DEFAULT_PORT` | Default port if `SMTP_PORT` not set | `587` | ❌ |
| `SMTP_SECURE_PORT` | Port that triggers secure connection | `465` | ❌ |
| `SMTP_SECURE` | Force secure connection (`true`/`false`) | Auto-detected | ❌ |
| `SMTP_USER` | SMTP authentication username | - | ✅ |
| `SMTP_PASSWORD` | SMTP authentication password | - | ✅ |
| `SMTP_FROM` | Default "From" address | - | ❌ |

#### Sender Configuration (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDER_DOMAIN` | Domain for random sender generation | `sauerdev.com` |
| `DEFAULT_SENDER_EMAIL` | Default sender when random senders disabled | `loadtest@sauerdev.com` |

### SMTP Port Guide

- **Port 587** (Recommended): SMTP submission with STARTTLS - best for deliverability
- **Port 465**: SMTP over SSL/TLS (SMTPS) - implicit encryption
- **Port 25**: Standard SMTP (often blocked by ISPs)

## Usage 📖

### Web Interface

1. **Enter Recipients**: Add one or more email addresses (comma or newline separated)
2. **Configure Test**:
   - Set total number of emails
   - Choose mode (Burst or Rate-Limited)
   - Configure rate limits if using rate-limited mode
   - Optional: Set duration limit, enable attachments, random senders, etc.
3. **Start Test**: Click "Start Test" to begin
4. **Monitor Progress**: Watch real-time statistics update
5. **Stop Test**: Click "Stop Test" to cancel a running test

### API Endpoints

#### Start Load Test

```http
POST /api/load-test
Content-Type: application/json

{
  "recipients": ["test@example.com"],
  "totalEmails": 100,
  "mode": "burst",
  "includeAttachments": false,
  "randomSenders": false,
  "richHTML": true,
  "subject": "Test Email",
  "body": "Test body content"
}
```

**Rate-Limited Mode:**
```json
{
  "recipients": ["test@example.com"],
  "totalEmails": 1000,
  "mode": "rate-limited",
  "rateLimit": {
    "count": 10,
    "interval": "second"
  },
  "duration": 60
}
```

**Response:**
```json
{
  "testId": "test-1234567890-abc123",
  "status": "started"
}
```

#### Get Test Status

```http
GET /api/load-test?testId=test-1234567890-abc123
```

**Response:**
```json
{
  "testId": "test-1234567890-abc123",
  "status": "running",
  "stats": {
    "sent": 50,
    "success": 48,
    "failed": 2,
    "errors": [
      { "email": 25, "error": "Connection timeout" }
    ],
    "totalDuration": 5000,
    "averageSendTime": 100,
    "currentRate": 10
  }
}
```

#### Stop Test

```http
DELETE /api/load-test?testId=test-1234567890-abc123
```

**Response:**
```json
{
  "testId": "test-1234567890-abc123",
  "status": "stopped"
}
```

#### Check Environment Variables

```http
GET /api/debug-env
```

**Response:**
```json
{
  "message": "Environment variable check",
  "env": {
    "SMTP_HOST": "✓ Set",
    "SMTP_PORT": "✓ Set (587)",
    "SMTP_USER": "✓ Set",
    "SMTP_PASS": "✓ Set"
  }
}
```

## Development 🛠️

### Project Structure

```
MailShottie/
├── app/
│   ├── api/
│   │   ├── debug-env/      # Environment variable checker
│   │   └── load-test/       # Load test API endpoints
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main UI
├── components/
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── html-email-generator.ts  # HTML email generation
│   ├── mail.ts                  # SMTP email sending
│   ├── pdf-generator.ts         # PDF attachment generation
│   ├── sender-generator.ts      # Random sender generation
│   └── theme-provider.tsx       # Theme management
└── .env.example                 # Environment variable template
```

### Available Scripts

```bash
# Development
bun dev          # Start development server

# Production
bun build        # Build for production
bun start        # Start production server

# Linting
bun lint         # Run ESLint
```

### Tech Stack

- **Framework**: Next.js 16.1.1
- **Language**: TypeScript 5
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Email**: Nodemailer
- **PDF**: pdf-lib
- **Icons**: Hugeicons

## Testing Scenarios 🧪

### Stress Testing
- Use **Burst Mode** with large email counts
- Test your SMTP server's capacity limits
- Monitor for connection timeouts and failures

### Rate Limiting
- Use **Rate-Limited Mode** to simulate realistic traffic
- Test your email service provider's rate limits
- Verify your infrastructure can handle sustained loads

### Attachment Testing
- Enable PDF attachments of various sizes
- Test email size limits
- Verify attachment delivery

### Sender Diversity
- Enable random sender generation
- Test spam filtering and reputation
- Simulate multi-sender scenarios

## Security Considerations 🔒

- **Never commit `.env.local`** - It's already in `.gitignore`
- Use environment variables for all sensitive data
- Consider using secrets management in production
- Be mindful of email service provider rate limits
- Respect recipient inboxes - use test accounts

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is open source and available under the [MIT License](LICENSE).

## Support 💬

- **Issues**: [GitHub Issues](https://github.com/lohsefar/MailShottie/issues)
- **Repository**: [GitHub Repository](https://github.com/lohsefar/MailShottie)

## Acknowledgments 🙏

- Built with [Next.js](https://nextjs.org)
- Email functionality powered by [Nodemailer](https://nodemailer.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

Made with ❤️ for testing email infrastructure
