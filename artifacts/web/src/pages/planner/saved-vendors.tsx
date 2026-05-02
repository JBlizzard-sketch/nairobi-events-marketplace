import { useState } from "react";
import { Link } from "wouter";
import { useGetVendor } from "@workspace/api-client-react";
import { useSavedVendors } from "@/hooks/use-saved-vendors";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Star, MapPin, Heart, Briefcase, MessageSquare,
  ArrowRight, ShieldCheck, Award, Search,
} from "lucide-react";

function OverallStars({ value }: { value: number }) {
  const r = Math.round(Math.min(Math.max(value, 0), 5));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-muted-foreground">
        {Number(value).toFixed(1)}
      </span>
    </div>
  );
}

function SavedVendorCard({ id, onRemove }: { id: string; onRemove: () => void }) {
  const { data: vendor, isLoading } = useGetVendor(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendor) {
    return (
      <Card className="shadow-sm border-dashed opacity-60">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">Vendor no longer available</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="gap-1.5 text-muted-foreground hover:text-destructive h-8 px-2"
          >
            <Heart className="h-3.5 w-3.5" />
            Remove
          </Button>
        </CardContent>
      </Card>
    );
  }

  const v = vendor as any;
  const serviceParam = v.category ? `?service=${v.category}` : "";

  return (
    <>
    <Card className="shadow-sm hover:shadow-md transition-all group border-border hover:border-primary/30">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                {v.businessName}
              </h3>
              {v.isPremium && (
                <Badge className="text-xs gap-1 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50 py-0">
                  <Award className="h-2.5 w-2.5" />Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="capitalize text-xs">
                {v.category?.replace(/_/g, " ")}
              </Badge>
              {v.city && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{v.city}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            aria-label="Remove from saved"
            type="button"
          >
            <Heart className="h-4 w-4 fill-rose-400" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          {v.averageRating > 0 && (
            <div className="flex flex-col gap-0.5">
              <OverallStars value={Number(v.averageRating)} />
              <span className="text-xs text-muted-foreground">{v.totalReviews ?? 0} reviews</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            {v.totalBookings ?? 0} events
          </div>
          {v.averageRating > 4.5 && (
            <Badge variant="outline" className="text-xs gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/50 dark:bg-emerald-950/30">
              <ShieldCheck className="h-3 w-3" />Top Rated
            </Badge>
          )}
        </div>

        {/* Bio snippet */}
        {v.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {v.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link href={`/events/new${serviceParam}`} className="flex-1">
            <Button size="sm" className="w-full gap-1.5 font-semibold">
              Start Brief
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href={`/vendors/${v.id}`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from saved?</AlertDialogTitle>
          <AlertDialogDescription>
            This vendor will be removed from your saved list. You can save them again from the vendor directory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep saved</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onRemove}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function SavedVendors() {
  const { savedIds, toggle, count } = useSavedVendors();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved Vendors</h1>
          <p className="text-muted-foreground mt-1">
            {count === 0
              ? "No saved vendors yet"
              : `${count} vendor${count !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        <Link href="/vendors">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Browse Vendors
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {savedIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-full">
            <Heart className="h-12 w-12 text-rose-300 dark:text-rose-700" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">No saved vendors yet</h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Browse our vendor directory and tap the heart icon on any vendor profile to save them here for quick access.
            </p>
          </div>
          <Link href="/vendors">
            <Button className="gap-2 mt-2">
              <Search className="h-4 w-4" />
              Browse Vendors
            </Button>
          </Link>
        </div>
      )}

      {/* Grid */}
      {savedIds.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedIds.map(id => (
            <SavedVendorCard key={id} id={id} onRemove={() => toggle(id)} />
          ))}
        </div>
      )}

      {/* Tip */}
      {savedIds.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-4">
          Saved vendors are stored locally in your browser. Start a brief to get competing quotes from them — and others in the same category.
        </p>
      )}
    </div>
  );
}
