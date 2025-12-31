import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail";
import { generatePDF, type PDFOptions } from "@/lib/pdf-generator";
import { generateRandomSender } from "@/lib/sender-generator";
import { generateHTMLEmail } from "@/lib/html-email-generator";

interface LoadTestConfig {
  recipients: string[];
  totalEmails: number;
  mode: "burst" | "rate-limited";
  rateLimit?: {
    count: number;
    interval: "second" | "minute";
  };
  duration?: number; // in seconds
  includeAttachments: boolean;
  attachmentOptions?: PDFOptions;
  randomSenders: boolean;
  richHTML: boolean;
  subject?: string;
  body?: string;
}

interface TestStats {
  sent: number;
  success: number;
  failed: number;
  errors: Array<{ email: number; error: string }>;
  totalDuration: number;
  averageSendTime: number;
  currentRate: number;
}

// Store active tests (in production, use Redis or similar)
const activeTests = new Map<string, { abort: AbortController; stats: TestStats; totalEmails: number }>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateInterval(rateLimit: { count: number; interval: "second" | "minute" }): number {
  const intervalMs = rateLimit.interval === "second" ? 1000 : 60000;
  return intervalMs / rateLimit.count;
}

async function runLoadTest(
  testId: string,
  config: LoadTestConfig,
  signal: AbortSignal,
  statsRef: { current: TestStats }
): Promise<TestStats> {
  const startTime = Date.now();
  const sendTimes: number[] = [];

  // Generate senders if needed
  const defaultSender = process.env.DEFAULT_SENDER_EMAIL || "loadtest@sauerdev.com";
  const senders = config.randomSenders
    ? Array.from({ length: config.totalEmails }, () => generateRandomSender())
    : Array(config.totalEmails).fill(defaultSender);

  // Generate attachment if needed
  let attachment: Buffer | undefined;
  if (config.includeAttachments) {
    attachment = await generatePDF(config.attachmentOptions);
  }

  // Calculate sending strategy
  let emailsPerBatch = 1;
  let delayBetweenBatches = 0;

  if (config.mode === "rate-limited" && config.rateLimit) {
    delayBetweenBatches = calculateInterval(config.rateLimit);
    // For rate limiting, send one at a time
    emailsPerBatch = 1;
  } else if (config.mode === "burst") {
    // For burst, send in larger batches
    emailsPerBatch = Math.min(10, config.totalEmails);
  }

  // Distribute emails across recipients
  const recipientCount = config.recipients.length;
  let emailIndex = 0;

  while (emailIndex < config.totalEmails && !signal.aborted) {
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < emailsPerBatch && emailIndex < config.totalEmails; i++) {
      const recipient = config.recipients[emailIndex % recipientCount];
      const sender = senders[emailIndex];
      const emailNum = emailIndex + 1;

      const promise = (async () => {
        const sendStart = Date.now();
        try {
          // Generate HTML content
          let htmlContent: string | undefined;
          let textContent: string;
          
          if (config.richHTML) {
            htmlContent = generateHTMLEmail({
              emailNumber: emailNum,
              totalEmails: config.totalEmails,
            });
            textContent = `Load Test Email #${emailNum} of ${config.totalEmails}\n\nThis is a rich HTML email. Please view in an HTML-capable email client.`;
          } else if (config.body) {
            htmlContent = `<p>${config.body}</p>`;
            textContent = config.body;
          } else {
            htmlContent = `<p>This is load test email #${emailNum} of ${config.totalEmails}</p>`;
            textContent = `This is load test email #${emailNum} of ${config.totalEmails}`;
          }

          const result = await sendEmail({
            from: sender,
            to: recipient,
            subject: config.subject || `Load Test Email #${emailNum}`,
            text: textContent,
            html: htmlContent,
            attachments: attachment
              ? [
                  {
                    filename: `test-attachment-${emailNum}.pdf`,
                    content: attachment,
                  },
                ]
              : undefined,
          });

          const sendTime = Date.now() - sendStart;
          sendTimes.push(sendTime);
          statsRef.current.sent++;
          if (result.success) {
            statsRef.current.success++;
          } else {
            statsRef.current.failed++;
            statsRef.current.errors.push({ email: emailNum, error: result.error || "Unknown error" });
          }
          
          // Update calculated stats
          const totalDuration = Date.now() - startTime;
          statsRef.current.totalDuration = totalDuration;
          if (sendTimes.length > 0) {
            statsRef.current.averageSendTime = sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length;
          }
          if (totalDuration > 0) {
            statsRef.current.currentRate = (statsRef.current.sent / totalDuration) * 1000;
          }
        } catch (error) {
          statsRef.current.sent++;
          statsRef.current.failed++;
          statsRef.current.errors.push({
            email: emailNum,
            error: error instanceof Error ? error.message : String(error),
          });
          
          // Update calculated stats
          const totalDuration = Date.now() - startTime;
          statsRef.current.totalDuration = totalDuration;
          if (totalDuration > 0) {
            statsRef.current.currentRate = (statsRef.current.sent / totalDuration) * 1000;
          }
        }
      })();

      batchPromises.push(promise);
      emailIndex++;
    }

    await Promise.all(batchPromises);

    // Rate limiting delay
    if (delayBetweenBatches > 0 && emailIndex < config.totalEmails) {
      await sleep(delayBetweenBatches);
    }

    // Check duration limit
    const totalDuration = Date.now() - startTime;
    if (config.duration && totalDuration >= config.duration * 1000) {
      break;
    }
  }

  // Final stats update
  statsRef.current.totalDuration = Date.now() - startTime;
  if (sendTimes.length > 0) {
    statsRef.current.averageSendTime = sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length;
  }
  if (statsRef.current.totalDuration > 0) {
    statsRef.current.currentRate = (statsRef.current.sent / statsRef.current.totalDuration) * 1000;
  }

  return statsRef.current;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config: LoadTestConfig = body;

    // Validate config
    if (!config.recipients || config.recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    if (!config.totalEmails || config.totalEmails <= 0) {
      return NextResponse.json({ error: "Total emails must be greater than 0" }, { status: 400 });
    }

    if (config.mode === "rate-limited" && !config.rateLimit) {
      return NextResponse.json(
        { error: "Rate limit configuration is required for rate-limited mode" },
        { status: 400 }
      );
    }

    // Generate test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const abortController = new AbortController();
    
    const stats: TestStats = {
      sent: 0,
      success: 0,
      failed: 0,
      errors: [],
      totalDuration: 0,
      averageSendTime: 0,
      currentRate: 0,
    };

    activeTests.set(testId, {
      abort: abortController,
      stats,
      totalEmails: config.totalEmails,
    });

    // Start test asynchronously
    runLoadTest(testId, config, abortController.signal, { current: stats }).then((finalStats) => {
      // Test completed - abort signal to mark as completed
      const test = activeTests.get(testId);
      if (test) {
        test.stats = finalStats;
        // Abort signal to mark test as completed (not aborted by user, but naturally completed)
        test.abort.abort();
        // Keep in map for a bit to allow final stats retrieval, then delete
        setTimeout(() => activeTests.delete(testId), 60000); // Keep for 1 minute
      }
    }).catch((error) => {
      // Handle errors
      const test = activeTests.get(testId);
      if (test) {
        test.stats.errors.push({ email: 0, error: error instanceof Error ? error.message : String(error) });
        test.abort.abort(); // Mark as completed even on error
      }
      setTimeout(() => activeTests.delete(testId), 60000);
    });

    // Return test ID immediately
    return NextResponse.json({ testId, status: "started" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get("testId");

  if (!testId) {
    return NextResponse.json({ error: "testId is required" }, { status: 400 });
  }

  const test = activeTests.get(testId);
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  // Check if test is still running
  // Test is completed if:
  // 1. Abort signal is aborted (either manually stopped or naturally completed)
  // 2. All emails have been sent (sent >= totalEmails)
  const isRunning = !test.abort.signal.aborted && test.stats.sent < test.totalEmails;
  const status = isRunning ? "running" : "completed";

  return NextResponse.json({ testId, stats: test.stats, status });
}

export async function DELETE(request: NextRequest) {
  const testId = request.nextUrl.searchParams.get("testId");

  if (!testId) {
    return NextResponse.json({ error: "testId is required" }, { status: 400 });
  }

  const test = activeTests.get(testId);
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  test.abort.abort();
  activeTests.delete(testId);

  return NextResponse.json({ testId, status: "stopped" });
}

