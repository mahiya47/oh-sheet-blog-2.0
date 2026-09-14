// Composer fields for a post template (Recipe / Travel log). See
// backend's lib/postTemplates.js for the matching shape, and
// PostTemplateCard.jsx for how it renders back in the feed.

const TEMPLATE_OPTIONS = [
  { type: null, label: "No template" },
  { type: "recipe", label: "Recipe" },
  { type: "travel", label: "Travel log" },
  { type: "code", label: "Code snippet" },
];

const EMPTY_RECIPE = { servings: "", prepTime: "", cookTime: "", ingredients: [""], steps: [""] };
const EMPTY_TRAVEL = { place: "", startDate: "", endDate: "", highlights: [""] };
const EMPTY_CODE = { language: "", filename: "", code: "" };

export function emptyTemplateData(type) {
  if (type === "recipe") return { ...EMPTY_RECIPE, ingredients: [""], steps: [""] };
  if (type === "travel") return { ...EMPTY_TRAVEL, highlights: [""] };
  if (type === "code") return { ...EMPTY_CODE };
  return null;
}

function ListField({ label, placeholder, items, onChange }) {
  function updateItem(i, value) {
    const next = [...items];
    next[i] = value;
    onChange(next);
  }
  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="app-template-list-field">
      <label className="app-template-field-label">{label}</label>
      {items.map((value, i) => (
        <div className="app-template-list-row" key={i}>
          <input
            value={value}
            placeholder={placeholder}
            onChange={(e) => updateItem(i, e.target.value)}
          />
          {items.length > 1 && (
            <button
              type="button"
              className="app-template-list-remove"
              aria-label={`Remove ${label.toLowerCase()} item`}
              onClick={() => removeItem(i)}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" className="app-template-list-add" onClick={addItem}>
        + Add {label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}

export default function PostTemplateFields({ templateType, setTemplateType, templateData, setTemplateData }) {
  function selectType(type) {
    setTemplateType(type);
    setTemplateData(emptyTemplateData(type));
  }

  function patch(fields) {
    setTemplateData((prev) => ({ ...prev, ...fields }));
  }

  return (
    <div className="app-template-picker">
      <div className="app-template-type-row">
        {TEMPLATE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            className={"app-template-type-btn" + (templateType === opt.type ? " is-active" : "")}
            onClick={() => selectType(opt.type)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {templateType === "recipe" && templateData && (
        <div className="app-template-fields">
          <div className="app-template-field-row">
            <input
              value={templateData.servings}
              placeholder="Servings (e.g. 4)"
              onChange={(e) => patch({ servings: e.target.value })}
            />
            <input
              value={templateData.prepTime}
              placeholder="Prep time (e.g. 15 min)"
              onChange={(e) => patch({ prepTime: e.target.value })}
            />
            <input
              value={templateData.cookTime}
              placeholder="Cook time (e.g. 30 min)"
              onChange={(e) => patch({ cookTime: e.target.value })}
            />
          </div>
          <ListField
            label="Ingredients"
            placeholder="e.g. 2 cups flour"
            items={templateData.ingredients}
            onChange={(ingredients) => patch({ ingredients })}
          />
          <ListField
            label="Steps"
            placeholder="Describe a step..."
            items={templateData.steps}
            onChange={(steps) => patch({ steps })}
          />
        </div>
      )}

      {templateType === "travel" && templateData && (
        <div className="app-template-fields">
          <div className="app-template-field-row">
            <input
              value={templateData.place}
              placeholder="Where? (e.g. Lisbon, Portugal)"
              onChange={(e) => patch({ place: e.target.value })}
            />
            <input
              type="date"
              value={templateData.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
            />
            <input
              type="date"
              value={templateData.endDate}
              onChange={(e) => patch({ endDate: e.target.value })}
            />
          </div>
          <ListField
            label="Highlights"
            placeholder="A moment worth remembering..."
            items={templateData.highlights}
            onChange={(highlights) => patch({ highlights })}
          />
        </div>
      )}

      {templateType === "code" && templateData && (
        <div className="app-template-fields">
          <div className="app-template-field-row">
            <input
              value={templateData.language}
              placeholder="Language (e.g. JavaScript)"
              onChange={(e) => patch({ language: e.target.value })}
            />
            <input
              value={templateData.filename}
              placeholder="Filename (optional)"
              onChange={(e) => patch({ filename: e.target.value })}
            />
          </div>
          <textarea
            className="app-template-code-input"
            value={templateData.code}
            placeholder="Paste your code here..."
            spellCheck={false}
            rows={10}
            onChange={(e) => patch({ code: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
