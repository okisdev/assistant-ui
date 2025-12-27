"use client";

import { useState } from "react";
import { Building2, ExternalLink, Loader2, Star, MapPin } from "lucide-react";
import { makeAssistantToolUI } from "@assistant-ui/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HotelSearchResult } from "@/lib/ai/tools/apps/google-hotels";

type HotelSearchArgs = {
  location: string;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  currency?: string;
  sort_by?: string;
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function HotelCard({ hotel }: { hotel: HotelSearchResult["hotels"][number] }) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={hotel.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl bg-muted/30 transition-all hover:bg-muted/50 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {hotel.thumbnail && !imageError ? (
          <img
            src={hotel.thumbnail}
            alt={hotel.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Building2 className="size-12 text-muted-foreground/50" />
          </div>
        )}
        {hotel.hotel_class && (
          <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-white text-xs">
            {hotel.hotel_class}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-medium text-sm leading-tight">
          {hotel.name}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          {hotel.rating > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star className="size-3 fill-current" />
              {hotel.rating.toFixed(1)}
            </span>
          )}
          {hotel.reviews > 0 && (
            <span className="text-muted-foreground">
              ({hotel.reviews.toLocaleString()} reviews)
            </span>
          )}
        </div>

        {hotel.amenities.length > 0 && (
          <p className="line-clamp-1 text-muted-foreground text-xs">
            {hotel.amenities.slice(0, 3).join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-sm">{hotel.price}</span>
          <span className="text-muted-foreground text-xs">/night</span>
        </div>
      </div>
    </a>
  );
}

function LoadingState({ location }: { location: string }) {
  return (
    <div className="my-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">Searching hotels...</span>
          <span className="line-clamp-1 text-muted-foreground text-xs">
            Finding hotels in {location}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ searchUrl }: { searchUrl: string }) {
  return (
    <div className="my-4">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-muted/30 p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="size-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">No hotels data available</p>
          <p className="mt-1 text-muted-foreground text-xs">
            View results directly on Google Hotels
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={searchUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Open Google Hotels
          </a>
        </Button>
      </div>
    </div>
  );
}

export const HotelsToolUI = makeAssistantToolUI<
  HotelSearchArgs,
  HotelSearchResult
>({
  toolName: "app_google_hotels_search",
  render: function HotelsToolRender({ args, result, status }) {
    const isLoading = status.type === "running";
    const location = result?.search_metadata?.location ?? args.location ?? "";
    const checkIn =
      result?.search_metadata?.check_in_date ?? args.check_in_date;
    const checkOut =
      result?.search_metadata?.check_out_date ?? args.check_out_date;
    const hotels = result?.hotels ?? [];
    const searchUrl = result?.search_url ?? "";

    if (isLoading) {
      return <LoadingState location={location} />;
    }

    if (hotels.length === 0) {
      return <EmptyState searchUrl={searchUrl} />;
    }

    return (
      <div className="my-4">
        <div className="overflow-hidden rounded-xl bg-muted/30">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <MapPin className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  Hotels in {location}
                </span>
                {checkIn && checkOut && (
                  <span className="text-muted-foreground text-xs">
                    {formatDate(checkIn)} - {formatDate(checkOut)}
                  </span>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs">
              <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                View all
                <ExternalLink className="ml-1.5 size-3" />
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 pt-0 sm:grid-cols-3">
            {hotels.map((hotel, index) => (
              <HotelCard key={`${hotel.name}-${index}`} hotel={hotel} />
            ))}
          </div>
        </div>
      </div>
    );
  },
});
