import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListVendors } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Search, Award, ChevronRight, MapPin, Briefcase } from "lucide-react";

const CATEGORIES = [
  { value: "catering", label: "Catering" },
  { value: "mc", label: "MC / Emcee" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "floristry", label: "Floristry" },
  { value: "av_technical", label: "AV & Technical" },
  { value: "tent_furniture", label: "Tent & Furniture" },
  { value: "security", label: "Security" },
  { value: "entertainment", label: "Entertainment" },
  { value: "decor", label: "Decor" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

function StarRating({ rating }: { rating: number | string | null }) {
  const r = Number(rating ?? 0);
  return (
    <div className="flex items-center gap-1">
      <Star className={`h-3.5 w-3.5 ${r > 0 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      <span className="text-sm font-medium">{r > 0 ? r.toFixed(1) : "New"}</span>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function VendorsDirectory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("any");
  const [city, setCity] = useState<string>("all");

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useListVendors({
    q: debouncedSearch || undefined,
    category: category !== "all" ? (category as any) : undefined,
    minRating: minRating !== "any" ? Number(minRating) : undefined,
    city: city !== "all" ? city : undefined,
    page: 1,
    limit: 50,
  });

  const vendors = data?.vendors ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Directory</h1>
        <p className="text-muted-foreground mt-1">Browse Nairobi's vetted event professionals</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Rating</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-lg" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">No vendors found</h3>
          <p className="text-sm">
            {debouncedSearch
              ? `No results for "${debouncedSearch}". Try different keywords.`
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{data?.total ?? vendors.length} vetted vendor{(data?.total ?? vendors.length) !== 1 ? "s" : ""}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor: any) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="h-full cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                            {vendor.businessName}
                          </h3>
                          {vendor.isPremium && (
                            <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {vendor.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1 ml-2" />
                    </div>

                    {vendor.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{vendor.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {vendor.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {vendor.city}
                        </span>
                      )}
                      {vendor.totalBookings > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {vendor.totalBookings} events
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <StarRating rating={vendor.averageRating} />
                      {vendor.totalReviews > 0 && (
                        <span className="text-xs text-muted-foreground">{vendor.totalReviews} review{vendor.totalReviews !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
