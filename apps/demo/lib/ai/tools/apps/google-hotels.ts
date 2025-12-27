import { z } from "zod";
import type { ToolSet } from "ai";

const searchHotelsSchema = z.object({
  location: z.string().describe("Hotel location (city name or address)"),
  check_in_date: z
    .string()
    .describe("Check-in date in YYYY-MM-DD format (e.g., 2024-03-15)"),
  check_out_date: z
    .string()
    .describe("Check-out date in YYYY-MM-DD format (e.g., 2024-03-18)"),
  adults: z
    .number()
    .optional()
    .default(2)
    .describe("Number of adults (default: 2)"),
  currency: z
    .string()
    .optional()
    .default("USD")
    .describe("Currency code (default: USD)"),
  sort_by: z
    .enum(["relevance", "lowest_price", "highest_rating"])
    .optional()
    .default("relevance")
    .describe("Sort results by (default: relevance)"),
});

export type HotelSearchResult = {
  hotels: Array<{
    name: string;
    price: string;
    extracted_price: number;
    rating: number;
    reviews: number;
    thumbnail: string;
    link: string;
    amenities: string[];
    hotel_class?: string;
    description?: string;
  }>;
  search_metadata: {
    location: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    currency: string;
  };
  search_url: string;
};

type SerpAPIHotelProperty = {
  name: string;
  type?: string;
  description?: string;
  logo?: string;
  sponsored?: boolean;
  gps_coordinates?: { latitude: number; longitude: number };
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  prices?: Array<{
    source: string;
    logo?: string;
    num_guests?: number;
    rate_per_night?: {
      lowest?: string;
      extracted_lowest?: number;
      before_taxes_fees?: string;
      extracted_before_taxes_fees?: number;
    };
  }>;
  nearby_places?: Array<{
    name: string;
    transportations?: Array<{ type: string; duration: string }>;
  }>;
  hotel_class?: string;
  extracted_hotel_class?: number;
  images?: Array<{ thumbnail: string; original_image?: string }>;
  overall_rating?: number;
  reviews?: number;
  location_rating?: number;
  amenities?: string[];
  excluded_amenities?: string[];
  essential_info?: string[];
  property_token?: string;
  serpapi_property_details_link?: string;
  link?: string;
};

type SerpAPIResponse = {
  search_metadata?: {
    google_hotels_url?: string;
  };
  search_parameters?: {
    q?: string;
    check_in_date?: string;
    check_out_date?: string;
    adults?: number;
    currency?: string;
  };
  properties?: SerpAPIHotelProperty[];
  error?: string;
};

function buildGoogleHotelsUrl(params: {
  location: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
}): string {
  const baseUrl = "https://www.google.com/travel/hotels";
  const searchParams = new URLSearchParams({
    q: params.location,
    dates: `${params.check_in_date.replace(/-/g, "")}_${params.check_out_date.replace(/-/g, "")}`,
    adults: String(params.adults),
  });
  return `${baseUrl}?${searchParams.toString()}`;
}

async function searchHotelsWithSerpAPI(params: {
  location: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  currency: string;
  sort_by: string;
}): Promise<HotelSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    return {
      hotels: [],
      search_metadata: {
        location: params.location,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        adults: params.adults,
        currency: params.currency,
      },
      search_url: buildGoogleHotelsUrl(params),
    };
  }

  const searchParams = new URLSearchParams({
    engine: "google_hotels",
    q: params.location,
    check_in_date: params.check_in_date,
    check_out_date: params.check_out_date,
    adults: String(params.adults),
    currency: params.currency,
    api_key: apiKey,
  });

  if (params.sort_by === "lowest_price") {
    searchParams.set("sort_by", "8");
  } else if (params.sort_by === "highest_rating") {
    searchParams.set("sort_by", "3");
  }

  const response = await fetch(
    `https://serpapi.com/search?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as SerpAPIResponse;

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  const hotels =
    data.properties?.map((property) => ({
      name: property.name,
      price: property.rate_per_night?.lowest ?? "Price not available",
      extracted_price: property.rate_per_night?.extracted_lowest ?? 0,
      rating: property.overall_rating ?? 0,
      reviews: property.reviews ?? 0,
      thumbnail: property.images?.[0]?.thumbnail ?? "",
      link:
        property.link ??
        buildGoogleHotelsUrl({
          location: `${property.name} ${params.location}`,
          check_in_date: params.check_in_date,
          check_out_date: params.check_out_date,
          adults: params.adults,
        }),
      amenities: property.amenities?.slice(0, 5) ?? [],
      hotel_class: property.hotel_class,
      description: property.description,
    })) ?? [];

  return {
    hotels: hotels.slice(0, 6),
    search_metadata: {
      location: params.location,
      check_in_date: params.check_in_date,
      check_out_date: params.check_out_date,
      adults: params.adults,
      currency: params.currency,
    },
    search_url:
      data.search_metadata?.google_hotels_url ?? buildGoogleHotelsUrl(params),
  };
}

export function createGoogleHotelsTools(): ToolSet {
  return {
    app_google_hotels_search: {
      description:
        "Search for hotels by location and dates. Returns a list of hotels with prices, ratings, and booking links. Use this when users want to find accommodation.",
      inputSchema: searchHotelsSchema,
      execute: async ({
        location,
        check_in_date,
        check_out_date,
        adults = 2,
        currency = "USD",
        sort_by = "relevance",
      }: z.infer<typeof searchHotelsSchema>): Promise<HotelSearchResult> => {
        try {
          const result = await searchHotelsWithSerpAPI({
            location,
            check_in_date,
            check_out_date,
            adults,
            currency,
            sort_by,
          });

          return result;
        } catch {
          return {
            hotels: [],
            search_metadata: {
              location,
              check_in_date,
              check_out_date,
              adults,
              currency,
            },
            search_url: buildGoogleHotelsUrl({
              location,
              check_in_date,
              check_out_date,
              adults,
            }),
          };
        }
      },
    },
  };
}
