import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../../api/axios.js";
import { getInitials, resolveMediaUrl } from "../../utils/media.js";

const emptyTestimonialForm = {
  name: "",
  role: "renter",
  rating: 5,
  textContent: "",
  avatarUrl: "",
  videoUrl: ""
};

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const videoElement = document.createElement("video");

    videoElement.preload = "metadata";
    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;
      URL.revokeObjectURL(previewUrl);
      resolve(duration);
    };
    videoElement.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Unable to read the selected video."));
    };
    videoElement.src = previewUrl;
  });
}

export default function AdminTestimonialsSection({
  testimonials,
  testimonialsError,
  testimonialsLoading,
  refreshAdminData
}) {
  const videoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const avatarObjectUrlRef = useRef("");
  const [testimonialForm, setTestimonialForm] = useState(emptyTestimonialForm);
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [videoFileName, setVideoFileName] = useState("");

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

  function clearAvatarPreview() {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = "";
    }
    setAvatarPreviewUrl("");
  }

  function resetTestimonialForm() {
    setTestimonialForm({ ...emptyTestimonialForm });
    setEditingTestimonialId(null);
    clearAvatarPreview();
    setVideoFileName("");
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function updateTestimonialField(field, value) {
    setTestimonialForm((previousForm) => ({ ...previousForm, [field]: value }));

    if (field === "avatarUrl" && !avatarObjectUrlRef.current) {
      setAvatarPreviewUrl(value);
    }
  }

  async function handleVideoSelection() {
    const selectedVideo = videoInputRef.current?.files?.[0];

    if (!selectedVideo) {
      setVideoFileName("");
      return;
    }

    try {
      const duration = await readVideoDuration(selectedVideo);

      if (duration > 30) {
        toast.error("Video testimonials must be 30 seconds or less.");
        if (videoInputRef.current) videoInputRef.current.value = "";
        setVideoFileName("");
        return;
      }

      setVideoFileName(selectedVideo.name);
    } catch (error) {
      toast.error(error.message || "Unable to use the selected video.");
      if (videoInputRef.current) videoInputRef.current.value = "";
      setVideoFileName("");
    }
  }

  function handleAvatarSelection() {
    const selectedAvatar = avatarInputRef.current?.files?.[0];

    clearAvatarPreview();

    if (!selectedAvatar) {
      setAvatarPreviewUrl(testimonialForm.avatarUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAvatar);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarPreviewUrl(objectUrl);
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault();
    const selectedVideo = videoInputRef.current?.files?.[0] || null;
    const selectedAvatar = avatarInputRef.current?.files?.[0] || null;
    const hasTextContent = Boolean(testimonialForm.textContent.trim());

    if (!editingTestimonialId && !selectedVideo && !hasTextContent) {
      toast.error("Add a short video or testimonial text before saving.");
      return;
    }

    setSubmittingTestimonial(true);

    try {
      const formData = new FormData();
      formData.append("name", testimonialForm.name.trim());
      formData.append("role", testimonialForm.role);
      formData.append("rating", String(testimonialForm.rating));
      formData.append("textContent", testimonialForm.textContent.trim());
      formData.append("avatarUrl", testimonialForm.avatarUrl.trim());
      formData.append("videoUrl", testimonialForm.videoUrl || "");

      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      if (selectedAvatar) {
        formData.append("avatar", selectedAvatar);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      };

      if (editingTestimonialId) {
        await api.put(`/admin/testimonials/${editingTestimonialId}`, formData, config);
        toast.success("Testimonial updated successfully.");
      } else {
        await api.post("/admin/testimonials", formData, config);
        toast.success("Testimonial created successfully.");
      }

      resetTestimonialForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
    } finally {
      setSubmittingTestimonial(false);
    }
  }

  function handleEditTestimonial(testimonial) {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({
      name: testimonial.name,
      role: testimonial.role,
      rating: testimonial.rating || 5,
      textContent: testimonial.textContent || "",
      avatarUrl: testimonial.avatarUrl || "",
      videoUrl: testimonial.videoUrl || ""
    });
    clearAvatarPreview();
    setAvatarPreviewUrl(testimonial.avatarUrl || "");
    setVideoFileName("");
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleDeleteTestimonial(testimonial) {
    const confirmed = window.confirm(
      `Delete testimonial from ${testimonial.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingTestimonialId(testimonial.id);
    try {
      await api.delete(`/admin/testimonials/${testimonial.id}`);
      toast.success("Testimonial deleted successfully.");
      if (editingTestimonialId === testimonial.id) resetTestimonialForm();
      refreshAdminData();
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError));
    } finally {
      setDeletingTestimonialId(null);
    }
  }

  if (testimonialsError) {
    return (
      <div className="status-card error">
        <p>{testimonialsError}</p>
        <button type="button" className="btn primary" onClick={refreshAdminData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-testimonials-layout">
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Homepage Stories</p>
            <h2>{editingTestimonialId ? "Edit testimonial" : "Create testimonial"}</h2>
          </div>
          <p className="section-meta">
            Add video, text, rating, and optional avatar details for the homepage sections.
          </p>
        </div>

        <form onSubmit={handleTestimonialSubmit} className="admin-form">
          <div className="form-grid admin-two-column-grid">
            <label className="admin-field">
              <span>Name *</span>
              <input
                type="text"
                value={testimonialForm.name}
                onChange={(event) => updateTestimonialField("name", event.target.value)}
                placeholder="Enter testimonial name"
                required
              />
            </label>

            <label className="admin-field">
              <span>Role *</span>
              <select
                value={testimonialForm.role}
                onChange={(event) => updateTestimonialField("role", event.target.value)}
                required
              >
                <option value="renter">Renter</option>
                <option value="landlord">Landlord</option>
                <option value="technician">Technician</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Rating</span>
              <select
                value={testimonialForm.rating}
                onChange={(event) => updateTestimonialField("rating", Number(event.target.value))}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Avatar URL</span>
              <input
                type="url"
                value={testimonialForm.avatarUrl}
                onChange={(event) => updateTestimonialField("avatarUrl", event.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </label>

            <label className="admin-field">
              <span>Avatar upload</span>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarSelection}
              />
              <small className="form-hint">Optional. Upload an avatar if you do not want to use a URL.</small>
            </label>

            <label className="admin-field">
              <span>Video upload</span>
              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={handleVideoSelection}
              />
              <small className="form-hint">
                Optional when you provide text. Videos should be 30 seconds or less.
              </small>
            </label>

            <label className="admin-field admin-field-full">
              <span>Testimonial text</span>
              <textarea
                value={testimonialForm.textContent}
                onChange={(event) => updateTestimonialField("textContent", event.target.value)}
                placeholder="Write a short conversion-focused customer story."
                rows={5}
              />
            </label>
          </div>

          <div className="testimonial-editor-preview">
            <div className="testimonial-editor-avatar">
              {avatarPreviewUrl ? (
                <img src={resolveMediaUrl(avatarPreviewUrl)} alt={testimonialForm.name || "Avatar preview"} />
              ) : (
                <span>{getInitials(testimonialForm.name)}</span>
              )}
            </div>
            <div className="testimonial-editor-meta">
              <strong>{testimonialForm.name || "Preview name"}</strong>
              <span>{testimonialForm.role}</span>
              <small>
                {videoFileName
                  ? `Selected video: ${videoFileName}`
                  : testimonialForm.videoUrl
                    ? "Using existing video"
                    : "No video selected"}
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={resetTestimonialForm}
              disabled={submittingTestimonial}
            >
              {editingTestimonialId ? "Cancel Edit" : "Reset Form"}
            </button>
            <button type="submit" className="btn primary" disabled={submittingTestimonial}>
              {submittingTestimonial
                ? "Saving..."
                : editingTestimonialId
                  ? "Update Testimonial"
                  : "Create Testimonial"}
            </button>
          </div>
        </form>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Existing testimonials</h2>
          </div>
          <p className="section-meta">{testimonials.length} total stories available for the homepage.</p>
        </div>

        {testimonialsLoading ? (
          <div className="admin-empty-state">
            <p>Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="admin-empty-state">
            <p>No testimonials yet. Create the first one from the editor.</p>
          </div>
        ) : (
          <div className="testimonial-admin-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.id} className="testimonial-admin-card">
                <div className="testimonial-admin-card-head">
                  <div className="testimonial-admin-avatar">
                    {testimonial.avatarUrl ? (
                      <img src={resolveMediaUrl(testimonial.avatarUrl)} alt={testimonial.name} />
                    ) : (
                      <span>{getInitials(testimonial.name)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{testimonial.name}</h3>
                    <p>
                      {testimonial.role} · {testimonial.rating}/5
                    </p>
                  </div>
                </div>

                <div className="testimonial-admin-tags">
                  <span className="pill neutral">{testimonial.videoUrl ? "Video" : "Text only"}</span>
                  {testimonial.textContent ? <span className="pill neutral">Text ready</span> : null}
                </div>

                <p className="testimonial-admin-copy">
                  {testimonial.textContent || "No text content added yet."}
                </p>

                <div className="testimonial-admin-footer">
                  <small>{new Date(testimonial.createdAt).toLocaleDateString()}</small>
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => handleEditTestimonial(testimonial)}
                      disabled={submittingTestimonial}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => handleDeleteTestimonial(testimonial)}
                      disabled={deletingTestimonialId === testimonial.id}
                    >
                      {deletingTestimonialId === testimonial.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
