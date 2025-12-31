"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { MailIcon, PlayIcon, StopIcon, FileIcon, SunIcon, MoonIcon, ComputerIcon } from "@hugeicons/core-free-icons"
import { useTheme } from "@/lib/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LoadTestStats {
  sent: number
  success: number
  failed: number
  errors: Array<{ email: number; error: string }>
  totalDuration: number
  averageSendTime: number
  currentRate: number
}

interface LoadTestConfig {
  recipients: string[]
  totalEmails: number
  mode: "burst" | "rate-limited"
  rateLimit?: {
    count: number
    interval: "second" | "minute"
  }
  duration?: number
  includeAttachments: boolean
  attachmentOptions?: {
    size: "small" | "medium" | "large"
    contentType: "text" | "table" | "mixed"
  }
  randomSenders: boolean
  richHTML: boolean
  subject?: string
  body?: string
}

export default function LoadTestPage() {
  const [recipients, setRecipients] = React.useState("")
  const [totalEmails, setTotalEmails] = React.useState(10)
  const [mode, setMode] = React.useState<"burst" | "rate-limited">("burst")
  const [rateCount, setRateCount] = React.useState(1)
  const [rateInterval, setRateInterval] = React.useState<"second" | "minute">("second")
  const [duration, setDuration] = React.useState("")
  const [includeAttachments, setIncludeAttachments] = React.useState(false)
  const [attachmentSize, setAttachmentSize] = React.useState<"small" | "medium" | "large">("medium")
  const [attachmentContent, setAttachmentContent] = React.useState<"text" | "table" | "mixed">("mixed")
  const [randomSenders, setRandomSenders] = React.useState(false)
  const [richHTML, setRichHTML] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  
  const { theme, setTheme } = useTheme()
  
  const [testId, setTestId] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<LoadTestStats | null>(null)
  const [status, setStatus] = React.useState<"idle" | "running" | "completed">("idle")
  const [pollingInterval, setPollingInterval] = React.useState<NodeJS.Timeout | null>(null)
  const [showErrors, setShowErrors] = React.useState(false)

  const startTest = async () => {
    const recipientList = recipients
      .split(/[,\n]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0 && r.includes("@"))

    if (recipientList.length === 0) {
      alert("Please enter at least one valid email address")
      return
    }

    if (totalEmails <= 0) {
      alert("Total emails must be greater than 0")
      return
    }

    if (mode === "rate-limited" && rateCount <= 0) {
      alert("Rate count must be greater than 0")
      return
    }

    try {
      const config: LoadTestConfig = {
        recipients: recipientList,
        totalEmails,
        mode,
        includeAttachments,
        randomSenders,
        richHTML,
      }

      if (mode === "rate-limited") {
        config.rateLimit = {
          count: rateCount,
          interval: rateInterval,
        }
      }

      if (duration) {
        config.duration = parseInt(duration, 10)
      }

      if (includeAttachments) {
        config.attachmentOptions = {
          size: attachmentSize,
          contentType: attachmentContent,
        }
      }

      if (subject) {
        config.subject = subject
      }

      if (body) {
        config.body = body
      }

      const response = await fetch("/api/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error}`)
        return
      }

      const data = await response.json()
      setTestId(data.testId)
      setStatus("running")
      setStats({
        sent: 0,
        success: 0,
        failed: 0,
        errors: [],
        totalDuration: 0,
        averageSendTime: 0,
        currentRate: 0,
      })

      // Start polling
      const interval = setInterval(() => {
        fetch(`/api/load-test?testId=${data.testId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.stats) {
              setStats(data.stats)
              setStatus(data.status === "completed" ? "completed" : "running")
              
              if (data.status === "completed") {
                clearInterval(interval)
                setPollingInterval(null)
              }
            }
          })
          .catch((err) => {
            console.error("Error polling stats:", err)
          })
      }, 500) // Poll every 500ms

      setPollingInterval(interval)
    } catch (error) {
      console.error("Error starting test:", error)
      alert("Failed to start test")
    }
  }

  const stopTest = async () => {
    if (!testId) return

    try {
      const response = await fetch(`/api/load-test?testId=${testId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setStatus("completed")
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
    } catch (error) {
      console.error("Error stopping test:", error)
    }
  }

  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const successRate = stats && stats.sent > 0
    ? ((stats.success / stats.sent) * 100).toFixed(1)
    : "0.0"

  const progress = stats && totalEmails > 0
    ? (stats.sent / totalEmails) * 100
    : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Email Load Testing Tool</h1>
          <p className="text-muted-foreground text-sm">
            Configure and execute email load tests with scheduling, attachments, and real-time monitoring
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              {theme === "light" ? (
                <HugeiconsIcon icon={SunIcon} strokeWidth={2} />
              ) : theme === "dark" ? (
                <HugeiconsIcon icon={MoonIcon} strokeWidth={2} />
              ) : (
                <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
              <DropdownMenuRadioItem value="light">
                <HugeiconsIcon icon={SunIcon} strokeWidth={2} className="mr-2" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <HugeiconsIcon icon={MoonIcon} strokeWidth={2} className="mr-2" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} className="mr-2" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure your load test parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Recipient Email Addresses</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Enter email addresses, one per line or comma-separated&#10;example@domain.com&#10;test@domain.com"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    rows={4}
                    disabled={status === "running"}
                  />
                  <FieldDescription>
                    Enter one or more email addresses (comma or newline separated)
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Total Emails to Send</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1"
                    value={totalEmails}
                    onChange={(e) => setTotalEmails(parseInt(e.target.value, 10) || 0)}
                    disabled={status === "running"}
                  />
                  <FieldDescription>
                    Total number of emails to send across all recipients
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Sending Mode</FieldLabel>
                <FieldContent>
                  <Select
                    value={mode}
                    onValueChange={(value: "burst" | "rate-limited") => setMode(value)}
                    disabled={status === "running"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="burst">Burst (All at once)</SelectItem>
                      <SelectItem value="rate-limited">Rate Limited</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {mode === "burst"
                      ? "Send all emails as quickly as possible"
                      : "Send emails at a controlled rate"}
                  </FieldDescription>
                </FieldContent>
              </Field>

              {mode === "rate-limited" && (
                <>
                  <Field>
                    <FieldLabel>Rate Limit</FieldLabel>
                    <FieldContent>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={rateCount}
                          onChange={(e) => setRateCount(parseInt(e.target.value, 10) || 1)}
                          disabled={status === "running"}
                          className="flex-1"
                        />
                        <Select
                          value={rateInterval}
                          onValueChange={(value: "second" | "minute") => setRateInterval(value)}
                          disabled={status === "running"}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="second">per second</SelectItem>
                            <SelectItem value="minute">per minute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FieldDescription>
                        Send {rateCount} email{rateCount !== 1 ? "s" : ""} {rateInterval === "second" ? "per second" : "per minute"}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </>
              )}

              <Field>
                <FieldLabel>Duration Limit (seconds, optional)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Leave empty for no limit"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={status === "running"}
                  />
                  <FieldDescription>
                    Stop sending after this many seconds (optional)
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Email Subject (optional)</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Load Test Email"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={status === "running"}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Email Body (optional)</FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder="Email body text"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    disabled={status === "running"}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldContent>
                  <Checkbox
                    checked={includeAttachments}
                    onCheckedChange={(checked) => setIncludeAttachments(checked === true)}
                    disabled={status === "running"}
                    label="Include PDF Attachments"
                  />
                  <FieldDescription>
                    Generate and attach PDF files to each email
                  </FieldDescription>
                </FieldContent>
              </Field>

              {includeAttachments && (
                <>
                  <Field>
                    <FieldLabel>Attachment Size</FieldLabel>
                    <FieldContent>
                      <Select
                        value={attachmentSize}
                        onValueChange={(value: "small" | "medium" | "large") => setAttachmentSize(value)}
                        disabled={status === "running"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Attachment Content Type</FieldLabel>
                    <FieldContent>
                      <Select
                        value={attachmentContent}
                        onValueChange={(value: "text" | "table" | "mixed") => setAttachmentContent(value)}
                        disabled={status === "running"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Only</SelectItem>
                          <SelectItem value="table">Table Data</SelectItem>
                          <SelectItem value="mixed">Mixed Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </>
              )}

              <Field>
                <FieldContent>
                  <Checkbox
                    checked={randomSenders}
                    onCheckedChange={(checked) => setRandomSenders(checked === true)}
                    disabled={status === "running"}
                    label="Use Random Sender Addresses"
                  />
                  <FieldDescription>
                    Generate random sender addresses for each email (uses SENDER_DOMAIN from environment)
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldContent>
                  <Checkbox
                    checked={richHTML}
                    onCheckedChange={(checked) => setRichHTML(checked === true)}
                    disabled={status === "running"}
                    label="Send Rich HTML Emails"
                  />
                  <FieldDescription>
                    Generate and send rich HTML emails with styled content, tables, and formatting
                  </FieldDescription>
                </FieldContent>
              </Field>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={startTest}
                  disabled={status === "running"}
                  className="flex-1"
                >
                  <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="mr-2" />
                  Start Test
                </Button>
                {status === "running" && (
                  <Button
                    onClick={stopTest}
                    variant="destructive"
                    className="flex-1"
                  >
                    <HugeiconsIcon icon={StopIcon} strokeWidth={2} className="mr-2" />
                    Stop Test
                  </Button>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Statistics Display */}
        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
            <CardDescription>
              {status === "idle" && "Start a test to see statistics"}
              {status === "running" && "Real-time test progress"}
              {status === "completed" && "Test completed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{stats.sent} / {totalEmails}</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-none overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                    <div className="text-2xl font-bold">{stats.sent}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Success</div>
                    <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                    <div className="text-2xl font-bold">{successRate}%</div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Average Send Time</span>
                    <span className="font-medium">{stats.averageSendTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current Rate</span>
                    <span className="font-medium">{stats.currentRate.toFixed(2)} emails/sec</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span className="font-medium">
                      {(stats.totalDuration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>

                {/* Errors */}
                {stats.errors.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowErrors(!showErrors)}
                      className="w-full justify-between"
                    >
                      <span>Errors ({stats.errors.length})</span>
                      <span>{showErrors ? "−" : "+"}</span>
                    </Button>
                    {showErrors && (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                        {stats.errors.slice(0, 20).map((error, idx) => (
                          <div key={idx} className="text-xs p-2 bg-destructive/10 rounded-none">
                            <div className="font-medium">Email #{error.email}</div>
                            <div className="text-muted-foreground">{error.error}</div>
                          </div>
                        ))}
                        {stats.errors.length > 20 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            ... and {stats.errors.length - 20} more errors
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant={status === "running" ? "default" : status === "completed" ? "secondary" : "outline"}>
                      {status === "running" && "Running"}
                      {status === "completed" && "Completed"}
                      {status === "idle" && "Idle"}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <HugeiconsIcon icon={MailIcon} strokeWidth={2} className="mx-auto mb-2 size-8 opacity-50" />
                <p>No test running</p>
                <p className="text-xs mt-1">Configure and start a test to see statistics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
