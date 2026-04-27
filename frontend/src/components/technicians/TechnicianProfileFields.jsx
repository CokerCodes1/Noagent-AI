import {
  resolveTechnicianCategoryOption,
  technicianCategories
} from "../../utils/technicianCategories.js";

export default function TechnicianProfileFields({
  form,
  onChange,
  isAdmin = false,
  isEditing = false,
  imagesInputRef = null,
  videoInputRef = null
}) {
  const categoryValue = resolveTechnicianCategoryOption(form.category);
  const showCustomCategory = categoryValue === "Others";
  const existingImages = Array.isArray(form.existing_images) ? form.existing_images : [];

  return (
    <>
      {isAdmin ? (
        <div className="form-grid">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="technician@example.com"
              required
            />
          </label>

          <label>
            <span>{isEditing ? "New password" : "Password"}</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder={
                isEditing
                  ? "Leave blank to keep the current password"
                  : "Minimum 6 characters"
              }
              required={!isEditing}
            />
          </label>
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Name</span>
          <input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Adebayo Electricals"
            required
          />
        </label>

        <label>
          <span>Category</span>
          <select
            value={categoryValue}
            onChange={(event) => onChange("category", event.target.value)}
            required
          >
            <option value="">Select a category</option>
            {technicianCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        {showCustomCategory ? (
          <label>
            <span>Custom category</span>
            <input
              value={form.custom_category}
              onChange={(event) => onChange("custom_category", event.target.value)}
              placeholder="Appliance Repair Specialist"
              required
            />
          </label>
        ) : null}

        <label>
          <span>Office address</span>
          <input
            value={form.office_address}
            onChange={(event) => onChange("office_address", event.target.value)}
            placeholder="12 Admiralty Way, Lekki"
            required
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            value={form.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="08012345678"
            required
          />
        </label>

        <label>
          <span>WhatsApp</span>
          <input
            value={form.whatsapp}
            onChange={(event) => onChange("whatsapp", event.target.value)}
            placeholder="08012345678"
          />
        </label>

        <label>
          <span>Website</span>
          <input
            value={form.website}
            onChange={(event) => onChange("website", event.target.value)}
            placeholder="www.example.com"
          />
        </label>

        <label>
          <span>Jobs delivered</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.jobs_completed}
            onChange={(event) => onChange("jobs_completed", event.target.value)}
          />
        </label>

        <label>
          <span>Total earnings (N)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.total_earnings}
            onChange={(event) => onChange("total_earnings", event.target.value)}
          />
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea
          rows="4"
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Describe your services, service areas, and standout experience."
          required
        />
      </label>

      <div className="form-grid">
        <label>
          <span>{isEditing ? "Replace portfolio images" : "Portfolio images"}</span>
          <input ref={imagesInputRef} type="file" accept="image/*" multiple />
        </label>

        <label>
          <span>{isEditing ? "Replace skill showcase video" : "Upload skill showcase video"}</span>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            required={!isEditing && !form.current_video_url}
          />
        </label>
      </div>

      {existingImages.length > 0 || form.current_video_url ? (
        <div className="status-card technician-media-note">
          {existingImages.length > 0 ? (
            <p>{existingImages.length} portfolio image(s) currently saved.</p>
          ) : null}
          {form.current_video_url ? (
            <p>Current showcase video is already saved. Upload a new file only if you want to replace it.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
