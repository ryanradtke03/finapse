import { useState } from "react";
import type {
  Ingredient,
  Recipe,
  RecipeFormData,
  Step,
} from "../types/recipies";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

type RecipeModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full overflow-hidden"
        style={{
          maxWidth: "520px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 pb-4"
          style={{ borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}
        >
          {title && (
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            style={{
              background: "#f5f5f5",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: "20px 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function RecipeModal({
  recipe,
  submitFunction,
  onClose,
}: RecipeModalProps & {
  submitFunction: (updatedRecipe: RecipeFormData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"ingredients" | "steps">(
    "ingredients",
  );
  const [showModal, setshowModal] = useState(false);

  const totalTime = (recipe?.prepTimeMin ?? 0) + (recipe?.cookTimeMin ?? 0);

  return (
    <Modal isOpen={!!recipe} onClose={onClose} title={recipe?.title}>
      {showModal && (
        <CreateModal
          onSubmit={submitFunction} // Placeholder, implement update logic here
          onClose={() => setshowModal(false)}
        />
      )}
      {/* Stats row */}
      <button
        onClick={() => setshowModal(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Update
      </button>

      <div className="flex gap-2 mb-5">
        {[
          { label: "Servings", value: recipe?.servings, icon: "🍽️" },
          recipe?.prepTimeMin
            ? { label: "Prep", value: `${recipe.prepTimeMin}m`, icon: "⏱️" }
            : null,
          recipe?.cookTimeMin
            ? { label: "Cook", value: `${recipe.cookTimeMin}m`, icon: "🔥" }
            : null,
          totalTime > 0
            ? { label: "Total", value: `${totalTime}m`, icon: "⏰" }
            : null,
        ]
          .filter(Boolean)
          .map((stat) => (
            <div
              key={stat!.label}
              style={{
                textAlign: "center",
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "12px 8px",
                flex: 1,
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                {stat!.icon}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                {stat!.value}
              </div>
              <div
                style={{
                  color: "#999",
                  fontSize: "10px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                {stat!.label}
              </div>
            </div>
          ))}
      </div>

      {/* Description */}
      {recipe?.description && (
        <p
          style={{
            color: "#666",
            fontSize: "14px",
            marginBottom: "20px",
            lineHeight: 1.6,
            borderLeft: "3px solid #a0855a",
            paddingLeft: "12px",
          }}
        >
          {recipe.description}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: "16px" }}>
        {(["ingredients", "steps"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px",
              border:
                activeTab === tab ? "2px solid #1a1a1a" : "2px solid #e0e0e0",
              borderRadius: "10px",
              background: activeTab === tab ? "#1a1a1a" : "transparent",
              cursor: "pointer",
              fontSize: "12px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: activeTab === tab ? "#fff" : "#aaa",
              fontWeight: "600",
              transition: "all 0.2s",
            }}
          >
            {tab} (
            {tab === "ingredients"
              ? (recipe?.ingredients.length ?? 0)
              : (recipe?.steps.length ?? 0)}
            )
          </button>
        ))}
      </div>

      {/* Ingredients */}
      {activeTab === "ingredients" && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {recipe?.ingredients.map((ing) => (
            <li
              key={ing.id}
              className="flex justify-between items-center"
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "#1a1a1a" }}>{ing.name}</span>
              <span
                style={{
                  color: "#a0855a",
                  fontWeight: "700",
                  background: "#fdf6ee",
                  padding: "2px 10px",
                  borderRadius: "20px",
                  fontSize: "13px",
                }}
              >
                {ing.amount}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Steps */}
      {activeTab === "steps" && (
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {recipe?.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li
                key={step.id}
                className="flex gap-3"
                style={{
                  background: "#fafafa",
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#a0855a",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  {step.order}
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#1a1a1a",
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#666",
                      lineHeight: 1.6,
                    }}
                  >
                    {step.instructions}
                  </p>
                </div>
              </li>
            ))}
        </ol>
      )}
    </Modal>
  );
}

export function CreateModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (formData: RecipeFormData) => Promise<void>;
  onClose: () => void;
}) {
  const emptyIngredient = () => ({ name: "", amount: "" });
  const emptyStep = () => ({ title: "", instructions: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    servings: 1,
    prepTimeMin: 1,
    cookTimeMin: 1,
    ingredients: [emptyIngredient()],
    steps: [emptyStep()],
  });

  // --- field helpers ---
  const setField = <K extends keyof RecipeFormData>(
    key: K,
    value: RecipeFormData[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }));

  const updateIngredient = (
    i: number,
    field: keyof Ingredient,
    value: string,
  ) =>
    setField(
      "ingredients",
      formData.ingredients.map((ing, idx) =>
        idx === i ? { ...ing, [field]: value } : ing,
      ),
    );

  const updateStep = (i: number, field: keyof Step, value: string) =>
    setField(
      "steps",
      formData.steps.map((step, idx) =>
        idx === i ? { ...step, [field]: value } : step,
      ),
    );

  const addIngredient = () =>
    setField("ingredients", [...formData.ingredients, emptyIngredient()]);
  const removeIngredient = (i: number) =>
    setField(
      "ingredients",
      formData.ingredients.filter((_, idx) => idx !== i),
    );

  const addStep = () => setField("steps", [...formData.steps, emptyStep()]);
  const removeStep = (i: number) =>
    setField(
      "steps",
      formData.steps.filter((_, idx) => idx !== i),
    );

  const handleSubmit = async () => {
    setIsLoading(true);
    await onSubmit(formData);
    setIsLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Recipe</h2>
          <button
            className="text-gray-400 hover:text-gray-600 text-lg p-1"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {/* Basic Info */}
          <section className="mb-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="e.g. Garlic Butter Chicken Pasta"
              value={formData.title}
              onChange={(e) => setField("title", e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-y h-20"
              placeholder="Short description of the recipe..."
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              {[
                { label: "Servings", key: "servings" as const },
                { label: "Prep Time (min)", key: "prepTimeMin" as const },
                { label: "Cook Time (min)", key: "cookTimeMin" as const },
              ].map(({ label, key }) => (
                <div key={key} className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    type="number"
                    min={0}
                    value={formData[key] as number}
                    onChange={(e) => setField(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Ingredients */}
          <section className="mb-7">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Ingredients
              </h3>
              <button
                className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                onClick={addIngredient}
              >
                + Add
              </button>
            </div>
            {formData.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input
                  className="flex-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Name (e.g. Chicken Breast)"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                />
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Amount (e.g. 2 large)"
                  value={ing.amount}
                  onChange={(e) =>
                    updateIngredient(i, "amount", e.target.value)
                  }
                />
                {formData.ingredients.length > 1 && (
                  <button
                    className="text-gray-400 hover:text-red-400 text-sm px-1"
                    onClick={() => removeIngredient(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* Steps */}
          <section className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Steps</h3>
              <button
                className="text-sm px-3 py-1 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                onClick={addStep}
              >
                + Add
              </button>
            </div>
            {formData.steps.map((step, i) => (
              <div
                key={i}
                className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex gap-2 items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <input
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Step title (e.g. Boil Pasta)"
                    value={step.title}
                    onChange={(e) => updateStep(i, "title", e.target.value)}
                  />
                  {formData.steps.length > 1 && (
                    <button
                      className="text-gray-400 hover:text-red-400 text-sm px-1"
                      onClick={() => removeStep(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 resize-y h-16"
                  placeholder="Instructions for this step..."
                  value={step.instructions}
                  onChange={(e) =>
                    updateStep(i, "instructions", e.target.value)
                  }
                />
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
