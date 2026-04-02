import { useState } from "react";

export default function Hero({ title, subtitle, onSearch }) {
  const [filters, setFilters] = useState({
    location: "",
    type: "",
    price: ""
  });

  function updateField(field, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value
    }));
  }

  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="eyebrow">Find a home faster</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <div className="hero-search">
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(event) => updateField("location", event.target.value)}
          />
          <input
            placeholder="Property type"
            value={filters.type}
            onChange={(event) => updateField("type", event.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={filters.price}
            onChange={(event) => updateField("price", event.target.value)}
          />
          <button className="btn primary" type="button" onClick={() => onSearch(filters)}>
            Apply Filters
          </button>
        </div>
      </div>
    </section>
  );
}
