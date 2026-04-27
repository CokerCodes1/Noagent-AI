import { useRef, useState } from "react";
import { toast } from "react-toastify";
import api, { extractErrorMessage } from "../../api/axios.js";

const emptyTestimonialForm = {
  name: "",
  role: "renter",
  rating: 5,
  textContent: "",
  avatarUrl: ""
};

export default function AdminTestimonialsSection({
  testimonials,
  testimonialsError,
  testimonialsLoading,
  refreshAdminData
}) {
  const videoInputRef = useRef(null);
  const [testimonialForm, setTestimonialForm] = useState(emptyTestimonialForm);
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState(null);

  function resetTestimonialForm() {
    setTestimonialForm({ ...emptyTestimonialForm });
    setEditingTestimonialId(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  function updateTestimonialField(field, value) {
    setTestimonialForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault();
    const selectedVideo = videoInputRef.current?.files?.[0] || null;

    if (!editingTestimonialId && !selectedVideo) {
      toast.error("Please upload a testimonial video.");
      return;
    }

    setSubmittingTestimonial(true);

    try {
      const formData = new FormData();
      formData.append("name", testimonialForm.name);
      formData.append("role", testimonialForm.role);
      formData.append("rating", testimonialForm.rating);
      formData.append("textContent", testimonialForm.textContent);
      formData.append("avatarUrl", testimonialForm.avatarUrl);

      if (selectedVideo) {
        formData.append("video", selectedVideo);
      } else if (editingTestimonialId) {
        formData.append("videoUrl", testimonialForm.videoUrl || "");
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
      rating: testimonial.rating,
      textContent: testimonial.textContent,
      avatarUrl: testimonial.avatarUrl,
      videoUrl: testimonial.videoUrl
    });
    if (videoInputRef.current) videoInputRef.current.value = "";
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
      <div className="error-message">
        <p>{testimonialsError}</p>
        <button
          type="button"
          className="btn primary"
          onClick={refreshAdminData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-grid">
        <div className="section-content">
          <div className="section-header">
            <h2>Testimonials Management</h2>
            <p>Create and manage video and text testimonials for the homepage.</p>
          </div>

          <form onSubmit={handleTestimonialSubmit} className="admin-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="testimonial-name">Name *</label>
                <input
                  id="testimonial-name"
                  type="text"
                  value={testimonialForm.name}
                  onChange={(event) => updateTestimonialField("name", event.target.value)}
                  placeholder="Enter testimonial name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="testimonial-role">Role *</label>
                <select
                  id="testimonial-role"
                  value={testimonialForm.role}
                  onChange={(event) => updateTestimonialField("role", event.target.value)}
                  required
                >
                  <option value="renter">Renter</option>
                  <option value="landlord">Landlord</option>
                  <option value="technician">Technician</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="testimonial-rating">Rating</label>
                <select
                  id="testimonial-rating"
                  value={testimonialForm.rating}
                  onChange={(event) => updateTestimonialField("rating", Number(event.target.value))}
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="testimonial-avatar">Avatar URL</label>
                <input
                  id="testimonial-avatar"
                  type="url"
                  value={testimonialForm.avatarUrl}
                  onChange={(event) => updateTestimonialField("avatarUrl", event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="testimonial-text">Testimonial Text</label>
                <textarea
                  id="testimonial-text"
                  value={testimonialForm.textContent}
                  onChange={(event) => updateTestimonialField("textContent", event.target.value)}
                  placeholder="Enter testimonial text (optional for video testimonials)"
                  rows={4}
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="testimonial-video">Video Upload *</label>
                <input
                  id="testimonial-video"
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  required={!editingTestimonialId}
                />
                <small className="form-hint">
                  {editingTestimonialId
                    ? "Leave empty to keep current video"
                    : "Upload a video testimonial (max 30 seconds recommended)"}
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
              <button
                type="submit"
                className="btn primary"
                disabled={submittingTestimonial}
              >
                {submittingTestimonial
                  ? "Saving..."
                  : editingTestimonialId
                  ? "Update Testimonial"
                  : "Create Testimonial"}
              </button>
            </div>
          </form>

          <div className="data-table-container">
            <div className="table-header">
              <h3>Existing Testimonials ({testimonials.length})</h3>
            </div>

            {testimonialsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading testimonials...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="empty-state">
                <p>No testimonials found. Create your first testimonial above.</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map((testimonial) => (
                      <tr key={testimonial.id}>
                        <td>{testimonial.name}</td>
                        <td className="capitalize">{testimonial.role}</td>
                        <td>
                          {testimonial.videoUrl ? "Video" : "Text"}
                          {testimonial.textContent && testimonial.videoUrl && " + Text"}
                        </td>
                        <td>{testimonial.rating} ⭐</td>
                        <td>{new Date(testimonial.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="btn small primary"
                              onClick={() => handleEditTestimonial(testimonial)}
                              disabled={submittingTestimonial}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn small danger"
                              onClick={() => handleDeleteTestimonial(testimonial)}
                              disabled={deletingTestimonialId === testimonial.id}
                            >
                              {deletingTestimonialId === testimonial.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}