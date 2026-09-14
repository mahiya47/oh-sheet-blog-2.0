import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="app-template-code-copy"
      onClick={(e) => {
        e.stopPropagation();
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// Renders a post's template data (Recipe / Travel log / Code snippet) as
// a card above the caption. See PostTemplateFields.jsx for the composer
// side.
export default function PostTemplateCard({ templateType, templateData }) {
  if (!templateType || !templateData) return null;

  if (templateType === "recipe") {
    const { servings, prepTime, cookTime, ingredients = [], steps = [] } = templateData;
    return (
      <div className="app-template-card app-template-card-recipe">
        <p className="app-template-card-kind">🍳 Recipe</p>
        {(servings || prepTime || cookTime) && (
          <div className="app-template-card-meta">
            {servings && <span>Serves {servings}</span>}
            {prepTime && <span>Prep {prepTime}</span>}
            {cookTime && <span>Cook {cookTime}</span>}
          </div>
        )}
        {ingredients.length > 0 && (
          <div className="app-template-card-section">
            <h4>Ingredients</h4>
            <ul>
              {ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {steps.length > 0 && (
          <div className="app-template-card-section">
            <h4>Steps</h4>
            <ol>
              {steps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (templateType === "travel") {
    const { place, startDate, endDate, highlights = [] } = templateData;
    const dateRange = [startDate, endDate].filter(Boolean).join(" – ");
    return (
      <div className="app-template-card app-template-card-travel">
        <p className="app-template-card-kind">✈️ Travel log</p>
        {(place || dateRange) && (
          <div className="app-template-card-meta">
            {place && <span>{place}</span>}
            {dateRange && <span>{dateRange}</span>}
          </div>
        )}
        {highlights.length > 0 && (
          <div className="app-template-card-section">
            <h4>Highlights</h4>
            <ul>
              {highlights.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (templateType === "code") {
    const { language, filename, code } = templateData;
    return (
      <div className="app-template-card app-template-card-code" onClick={(e) => e.stopPropagation()}>
        <div className="app-template-code-head">
          <p className="app-template-card-kind">💻 Code{language ? ` · ${language}` : ""}</p>
          {code && <CopyButton text={code} />}
        </div>
        {filename && <p className="app-template-code-filename">{filename}</p>}
        {code && (
          <pre className="app-template-code-block">
            <code>{code}</code>
          </pre>
        )}
      </div>
    );
  }

  return null;
}
