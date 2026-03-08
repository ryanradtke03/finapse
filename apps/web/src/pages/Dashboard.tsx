import { useEffect, useState } from "react";
import { CreateModal, RecipeModal } from "../components/RecipieModal";
import type { Recipe, RecipeFormData, RecipeListItem } from "../types/recipies";
import logger from "../utils/logger";

function DeleteButton({ onClick }: { onClick: () => Promise<void> | void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
    >
      <div>Delete</div>
    </button>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipieInfo(recipeId: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recipies/${recipeId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch recipe info!");
      }

      const data: Recipe = await res.json();
      setSelectedRecipe(data);
      logger.log("Fetched recipe info:", { data });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }
  }

  async function fetchRecipes() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipies/list`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recipes!");
      }

      const data: RecipeListItem[] = await res.json();

      setRecipes(data);
      setLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }
  }

  const handleCreateRecipe = async (formData: RecipeFormData) => {
    logger.log("Creating recipe with data:", formData);

    const payload = {
      ...formData,
      steps: formData.steps.map((step, i) => ({ ...step, order: i + 1 })),
    };

    logger.log("Transformed payload for API:", payload);

    // Validate form data before sending request
    if (!payload.title.trim()) {
      setError("Title is required");
      return;
    }
    if (payload.ingredients.length === 0) {
      setError("At least one ingredient is required");
      return;
    }
    if (payload.steps.length === 0) {
      setError("At least one step is required");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipies`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json(); // or res.text() if not JSON
        logger.error("API error:", res.status, errorBody);
        throw new Error("Failed to create recipe!");
      }

      const data: Recipe = await res.json();
      logger.log("Recipe created successfully:", { data });

      setRecipes((prev) => [data, ...prev]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }

    setShowCreateModal(false);
  };

  async function handleDeleteRecipe(recipeId: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recipies/${recipeId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const errorBody = await res.json(); // or res.text() if not JSON
        logger.error("API error on delete:", res.status, errorBody);
        throw new Error("Failed to delete recipe!");
      }

      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setSelectedRecipe(null);
      logger.log("Recipe deleted successfully:", { recipeId });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-500">
          <div className="text-xl">{error}</div>
        </div>
      );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="text-4xl font-bold text-center mb-5 text-white">
        Welcome to Meal Planner!
      </div>
      <div>
        <p className="text-lg text-center">
          Plan your meals, track your ingredients, and cook delicious dishes!
        </p>
        {loading && <div className="text-center mt-4">Loading...</div>}# Button
        to Create a New Recipe
        <div className="flex justify-center mt-6">
          <button onClick={() => setShowCreateModal(true)}>
            <div className="rounded-xl border border-green-500 bg-green-600 px-6 py-4 text-white">
              Create New Recipe
            </div>
          </button>
        </div>
        {recipes.length > 0 &&
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="relative mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <button
                className="w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  fetchRecipieInfo(recipe.id);
                }}
              >
                <h2 className="text-2xl font-bold text-red-500">
                  {recipe.title}
                </h2>
                {recipe.description && (
                  <p className="mt-2 text-gray-400">{recipe.description}</p>
                )}
              </button>

              <DeleteButton
                onClick={() => {
                  handleDeleteRecipe(recipe.id);
                }}
              />
            </div>
          ))}
      </div>

      {showCreateModal && (
        <CreateModal
          onSubmit={handleCreateRecipe}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </main>
  );
}
