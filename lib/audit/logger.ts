export interface AuditEvent {
  timestamp: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const auditEvents: AuditEvent[] = [];

export function logAuditEvent(
  type: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const event: AuditEvent = {
    timestamp: new Date().toISOString(),
    type,
    message,
    metadata,
  };

  auditEvents.push(event);

  console.log(`[AUDIT] ${type}: ${message}`);

  return event;
}

export function getAuditEvents() {
  return auditEvents;
}