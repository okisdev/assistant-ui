import { z } from "zod";
import type { ToolSet } from "ai";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarEvent,
} from "@/lib/integrations/google-calendar";

export const listCalendarEventsSchema = z.object({
  timeMin: z
    .string()
    .optional()
    .describe(
      "Start time for the events query (ISO 8601 format). Defaults to now.",
    ),
  timeMax: z
    .string()
    .optional()
    .describe("End time for the events query (ISO 8601 format)."),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of events to return (default: 10)"),
  query: z.string().optional().describe("Free text search query for events"),
});

export const createCalendarEventSchema = z.object({
  summary: z.string().describe("Title of the event"),
  description: z.string().optional().describe("Description of the event"),
  location: z.string().optional().describe("Location of the event"),
  startDateTime: z
    .string()
    .describe(
      "Start date and time in ISO 8601 format (e.g., 2024-01-15T10:00:00-05:00)",
    ),
  endDateTime: z
    .string()
    .describe(
      "End date and time in ISO 8601 format (e.g., 2024-01-15T11:00:00-05:00)",
    ),
  timeZone: z
    .string()
    .optional()
    .describe("Time zone for the event (e.g., America/New_York)"),
  attendees: z
    .array(z.string())
    .optional()
    .describe("Email addresses of attendees"),
});

export const updateCalendarEventSchema = z.object({
  eventId: z.string().describe("The ID of the event to update"),
  summary: z.string().optional().describe("New title of the event"),
  description: z.string().optional().describe("New description of the event"),
  location: z.string().optional().describe("New location of the event"),
  startDateTime: z
    .string()
    .optional()
    .describe("New start date and time in ISO 8601 format"),
  endDateTime: z
    .string()
    .optional()
    .describe("New end date and time in ISO 8601 format"),
  timeZone: z.string().optional().describe("Time zone for the event"),
});

export const deleteCalendarEventSchema = z.object({
  eventId: z.string().describe("The ID of the event to delete"),
});

function formatEventForDisplay(event: CalendarEvent): string {
  const start = event.start.dateTime || event.start.date || "Unknown";
  const end = event.end.dateTime || event.end.date || "Unknown";
  const parts = [
    `Event: ${event.summary || "(No title)"}`,
    `  ID: ${event.id}`,
    `  Start: ${start}`,
    `  End: ${end}`,
  ];
  if (event.location) parts.push(`  Location: ${event.location}`);
  if (event.description) parts.push(`  Description: ${event.description}`);
  if (event.attendees?.length) {
    const attendeeList = event.attendees
      .map((a) => a.displayName || a.email)
      .join(", ");
    parts.push(`  Attendees: ${attendeeList}`);
  }
  return parts.join("\n");
}

export function createGoogleCalendarTools(accessToken: string): ToolSet {
  return {
    app_google_calendar_list_events: {
      description:
        "List upcoming calendar events from Google Calendar. Use this to check schedules, find free time slots, or review upcoming meetings.",
      inputSchema: listCalendarEventsSchema,
      execute: async ({
        timeMin,
        timeMax,
        maxResults,
        query,
      }: z.infer<typeof listCalendarEventsSchema>) => {
        try {
          const events = await listEvents(accessToken, {
            timeMin,
            timeMax,
            maxResults,
            q: query,
          });

          if (events.length === 0) {
            return "No events found for the specified time range.";
          }

          const formatted = events.map(formatEventForDisplay).join("\n\n");
          return `Found ${events.length} event(s):\n\n${formatted}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to list calendar events: ${message}`;
        }
      },
    },

    app_google_calendar_create_event: {
      description:
        "Create a new event on Google Calendar. Use this to schedule meetings, appointments, or reminders.",
      inputSchema: createCalendarEventSchema,
      execute: async ({
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        timeZone,
        attendees,
      }: z.infer<typeof createCalendarEventSchema>) => {
        try {
          const event = await createEvent(accessToken, {
            summary,
            description,
            location,
            start: {
              dateTime: startDateTime,
              timeZone,
            },
            end: {
              dateTime: endDateTime,
              timeZone,
            },
            attendees: attendees?.map((email) => ({ email })),
          });

          return `Event created successfully:\n${formatEventForDisplay(event)}\n\nEvent link: ${event.htmlLink}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to create calendar event: ${message}`;
        }
      },
    },

    app_google_calendar_update_event: {
      description:
        "Update an existing event on Google Calendar. Use this to reschedule, change details, or modify events.",
      inputSchema: updateCalendarEventSchema,
      execute: async ({
        eventId,
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        timeZone,
      }: z.infer<typeof updateCalendarEventSchema>) => {
        try {
          const event = await updateEvent(accessToken, {
            eventId,
            summary,
            description,
            location,
            start: startDateTime
              ? { dateTime: startDateTime, timeZone }
              : undefined,
            end: endDateTime ? { dateTime: endDateTime, timeZone } : undefined,
          });

          return `Event updated successfully:\n${formatEventForDisplay(event)}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to update calendar event: ${message}`;
        }
      },
    },

    app_google_calendar_delete_event: {
      description:
        "Delete an event from Google Calendar. Use this to cancel meetings or remove events.",
      inputSchema: deleteCalendarEventSchema,
      execute: async ({
        eventId,
      }: z.infer<typeof deleteCalendarEventSchema>) => {
        try {
          await deleteEvent(accessToken, eventId);
          return `Event with ID "${eventId}" has been deleted successfully.`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to delete calendar event: ${message}`;
        }
      },
    },
  };
}
