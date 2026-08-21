import { createFileRoute } from "@tanstack/react-router";
import { CategoryPageContent } from "@/components/storefront/CategoryPageContent";

export const Route = createFileRoute("/shop/category/$slug")({
  head: () => ({
    meta: [
      { title: "DailyGear category" },
      {
        name: "description",
        content: "Browse verified DailyGear products by category.",
      },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  return <CategoryPageContent slug={slug} />;
}
