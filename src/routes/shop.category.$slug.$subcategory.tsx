import { createFileRoute } from "@tanstack/react-router";
import { CategoryPageContent } from "@/components/storefront/CategoryPageContent";

export const Route = createFileRoute("/shop/category/$slug/$subcategory")({
  head: () => ({
    meta: [
      { title: "DailyGear subcategory" },
      {
        name: "description",
        content: "Browse verified DailyGear products by subcategory.",
      },
    ],
  }),
  component: SubcategoryPage,
});

function SubcategoryPage() {
  const { slug, subcategory } = Route.useParams();
  return <CategoryPageContent slug={slug} subcategorySlug={subcategory} />;
}
