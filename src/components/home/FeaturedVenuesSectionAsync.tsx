import { Suspense } from "react";
import FeaturedVenuesSection from "@/components/FeaturedVenuesSection";
import FeaturedVenuesSectionSkeleton from "@/components/skeletons/FeaturedVenuesSectionSkeleton";
import SectionWithSettings from "@/components/SectionWithSettings";
import { getPartners } from "@/lib/data/partners";
import { TYPE_TO_SLUG, REGION_SLUG_TO_NAME } from "@/lib/data/venues";

interface FeaturedVenuesSectionAsyncProps {
  isAdmin: boolean;
}

async function FeaturedVenuesContent({ isAdmin }: FeaturedVenuesSectionAsyncProps) {
  const partners = await getPartners();

  const venueCards = partners.map((p) => {
    const href = p.href?.startsWith("/")
      ? p.href
      : `/${(p.href ?? "").split("/")[1] ?? "gangnam"}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${p.id}`;
    const regionName = REGION_SLUG_TO_NAME[(href?.split("/")[1] ?? "")] ?? p.region ?? "";
    const rawDesc = p.desc || "";
    const desc = rawDesc.length > 500 ? rawDesc.slice(0, 500) + "…" : rawDesc || undefined;
    return {
      href,
      region: regionName,
      name: p.name,
      star: p.stars || "★—",
      type: p.type,
      contact: (p.contact ?? "").trim() || undefined,
      price: undefined as string | undefined,
      desc: desc || undefined,
    };
  });

  return (
    <SectionWithSettings isAdmin={isAdmin} sectionKey="region_preview">
      <FeaturedVenuesSection venues={venueCards.length > 0 ? venueCards : undefined} />
    </SectionWithSettings>
  );
}

export default function FeaturedVenuesSectionAsync(props: FeaturedVenuesSectionAsyncProps) {
  return (
    <Suspense
      fallback={
        <SectionWithSettings isAdmin={props.isAdmin} sectionKey="region_preview">
          <FeaturedVenuesSectionSkeleton />
        </SectionWithSettings>
      }
    >
      <FeaturedVenuesContent {...props} />
    </Suspense>
  );
}
