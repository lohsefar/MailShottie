/**
 * Generates rich HTML email content for load testing
 */

export interface HTMLEmailOptions {
  emailNumber: number;
  totalEmails: number;
  includeStyles?: boolean;
}

export function generateHTMLEmail(options: HTMLEmailOptions): string {
  const { emailNumber, totalEmails, includeStyles = true } = options;

  const styles = includeStyles ? `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .container {
        background-color: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        border-bottom: 3px solid #4a90e2;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #2c3e50;
        margin: 0;
        font-size: 28px;
      }
      .header p {
        color: #7f8c8d;
        margin: 5px 0 0 0;
        font-size: 14px;
      }
      .content {
        margin: 20px 0;
      }
      .content h2 {
        color: #34495e;
        font-size: 22px;
        margin-top: 30px;
        margin-bottom: 15px;
      }
      .content p {
        margin-bottom: 15px;
        color: #555;
      }
      .highlight-box {
        background-color: #e8f4f8;
        border-left: 4px solid #4a90e2;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #4a90e2;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
        font-weight: 600;
      }
      .button:hover {
        background-color: #357abd;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }
      .stat-card {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #4a90e2;
      }
      .stat-label {
        font-size: 12px;
        color: #7f8c8d;
        margin-top: 5px;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        color: #95a5a6;
        font-size: 12px;
      }
      .badge {
        display: inline-block;
        padding: 4px 8px;
        background-color: #27ae60;
        color: white;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 10px;
      }
      ul {
        padding-left: 20px;
      }
      li {
        margin-bottom: 8px;
        color: #555;
      }
    </style>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Email #${emailNumber}</title>
  ${styles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Load Test Email #${emailNumber} <span class="badge">TEST</span></h1>
      <p>Email ${emailNumber} of ${totalEmails} in this load test</p>
    </div>

    <div class="content">
      <h2>Welcome to Load Testing</h2>
      <p>This is a rich HTML email generated for load testing purposes. It contains various HTML elements to simulate real-world email content.</p>

      <div class="highlight-box">
        <strong>Test Information:</strong>
        <ul>
          <li>Email Number: <strong>#${emailNumber}</strong></li>
          <li>Total Emails: <strong>${totalEmails}</strong></li>
          <li>Progress: <strong>${Math.round((emailNumber / totalEmails) * 100)}%</strong></li>
          <li>Generated: <strong>${new Date().toLocaleString()}</strong></li>
        </ul>
      </div>

      <h2>Sample Content Section</h2>
      <p>This email demonstrates various HTML elements commonly found in marketing and transactional emails. The content includes:</p>
      <ul>
        <li>Styled headers and typography</li>
        <li>Highlighted information boxes</li>
        <li>Call-to-action buttons</li>
        <li>Statistics and metrics display</li>
        <li>Professional footer content</li>
      </ul>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${emailNumber}</div>
          <div class="stat-label">Current Email</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalEmails - emailNumber}</div>
          <div class="stat-label">Remaining</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round((emailNumber / totalEmails) * 100)}%</div>
          <div class="stat-label">Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</div>
          <div class="stat-label">Time</div>
        </div>
      </div>

      <h2>Additional Information</h2>
      <p>This email is part of a load testing campaign designed to test email delivery systems, SMTP servers, and email processing pipelines. The content is automatically generated and includes realistic HTML structure and styling.</p>

      <p>If you're seeing this email, it means the load testing tool is working correctly and emails are being delivered successfully.</p>

      <a href="#" class="button">Sample Button</a>

      <h2>Technical Details</h2>
      <p>This email was generated using the MailShottie load testing tool. It includes:</p>
      <ul>
        <li>Responsive HTML structure</li>
        <li>Inline CSS styling</li>
        <li>Multiple content sections</li>
        <li>Statistics and metrics</li>
        <li>Professional formatting</li>
      </ul>
    </div>

    <div class="footer">
      <p>This is a test email generated by MailShottie Load Testing Tool</p>
      <p>Email #${emailNumber} of ${totalEmails} | Generated at ${new Date().toLocaleString()}</p>
      <p>Do not reply to this email - it is part of an automated load test</p>
    </div>
  </div>
</body>
</html>
  `;

  return html.trim();
}





