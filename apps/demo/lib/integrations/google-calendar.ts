const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  htmlLink: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
};

export type ListEventsOptions = {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated";
  q?: string;
};

export type CreateEventInput = {
  calendarId?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
};

export type UpdateEventInput = {
  calendarId?: string;
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
};

async function fetchCalendarApi<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Calendar API error: ${response.status}`,
    );
  }

  return response.json();
}

export async function listEvents(
  accessToken: string,
  options: ListEventsOptions = {},
): Promise<CalendarEvent[]> {
  const {
    calendarId = "primary",
    timeMin = new Date().toISOString(),
    timeMax,
    maxResults = 10,
    singleEvents = true,
    orderBy = "startTime",
    q,
  } = options;

  const params = new URLSearchParams({
    timeMin,
    maxResults: maxResults.toString(),
    singleEvents: singleEvents.toString(),
    orderBy,
  });

  if (timeMax) params.set("timeMax", timeMax);
  if (q) params.set("q", q);

  const data = await fetchCalendarApi<{ items: CalendarEvent[] }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
  );

  return data.items || [];
}

export async function getEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary",
): Promise<CalendarEvent> {
  return fetchCalendarApi<CalendarEvent>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
  );
}

export async function createEvent(
  accessToken: string,
  input: CreateEventInput,
): Promise<CalendarEvent> {
  const { calendarId = "primary", ...eventData } = input;

  return fetchCalendarApi<CalendarEvent>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify(eventData),
    },
  );
}

export async function updateEvent(
  accessToken: string,
  input: UpdateEventInput,
): Promise<CalendarEvent> {
  const { calendarId = "primary", eventId, ...updates } = input;

  return fetchCalendarApi<CalendarEvent>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
}

export async function deleteEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary",
): Promise<void> {
  await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
