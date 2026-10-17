import React, { useEffect, useState, useRef } from "react";
import { api, PhotoItem } from "../../api/client";

interface ClubPhotosViewProps {
  venueId?: string;
}

export const ClubPhotosView: React.FC<ClubPhotosViewProps> = ({ venueId }) => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit photo caption/order state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editOrder, setEditOrder] = useState<number>(0);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  // Delete confirm
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.getPhotos(venueId);
      setPhotos(res.photos || []);
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to load club photos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [venueId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check MIME type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setStatusMessage({ text: "Only JPEG, PNG, and WebP images are allowed.", type: "error" });
        return;
      }
      // Check size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ text: "File size exceeds 5 MB limit.", type: "error" });
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setStatusMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setStatusMessage(null);
      const nextOrder = photos.length;
      await api.uploadPhoto(selectedFile, captionInput, nextOrder, venueId);
      setStatusMessage({ text: "Photo uploaded successfully!", type: "success" });
      setSelectedFile(null);
      setFilePreview(null);
      setCaptionInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchPhotos();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to upload photo", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleStartEdit = (p: PhotoItem) => {
    setEditingPhotoId(p.id);
    setEditCaption(p.caption || "");
    setEditOrder(p.display_order);
  };

  const handleSaveEdit = async (photoId: string) => {
    try {
      setUpdatingPhoto(true);
      await api.updatePhoto(photoId, { caption: editCaption, display_order: editOrder }, venueId);
      setStatusMessage({ text: "Photo updated successfully", type: "success" });
      setEditingPhotoId(null);
      await fetchPhotos();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to update photo", type: "error" });
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await api.deletePhoto(photoId, venueId);
      setStatusMessage({ text: "Photo deleted and logged in audit trail.", type: "success" });
      setDeletingPhotoId(null);
      await fetchPhotos();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to delete photo", type: "error" });
    }
  };

  const handleMoveOrder = async (photo: PhotoItem, direction: "up" | "down") => {
    const currentIndex = photos.findIndex((p) => p.id === photo.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const targetPhoto = photos[targetIndex];
    try {
      // Swap display orders
      await api.updatePhoto(photo.id, { display_order: targetPhoto.display_order }, venueId);
      await api.updatePhoto(targetPhoto.id, { display_order: photo.display_order }, venueId);
      await fetchPhotos();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to reorder photos", type: "error" });
    }
  };

  if (loading && photos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "var(--spacing-12)", color: "var(--on-surface-variant)" }}>
        Loading venue gallery...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-6)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Venue Photo Gallery</h2>
          <p style={{ margin: "4px 0 0", color: "var(--outline)", fontSize: "13px" }}>
            Upload court and facility photos. Maximum 5 MB per photo (JPEG, PNG, WebP).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: "var(--surface-container-high)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {photos.length} Photo{photos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--spacing-6)",
            fontSize: "14px",
            backgroundColor:
              statusMessage.type === "success"
                ? "var(--success-container)"
                : statusMessage.type === "error"
                ? "var(--error-container)"
                : "var(--surface-container-high)",
            color:
              statusMessage.type === "success"
                ? "var(--on-success)"
                : statusMessage.type === "error"
                ? "var(--on-error)"
                : "var(--on-surface)",
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Upload Box */}
      <div
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "2px dashed var(--outline-variant)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--spacing-6)",
          marginBottom: "var(--spacing-8)",
        }}
      >
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginTop: 0, marginBottom: "var(--spacing-4)" }}>
          Upload New Photo
        </h3>
        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 300px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: "13px",
                  color: "var(--on-surface)",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--outline)", marginTop: "4px", display: "block" }}>
                Accepted formats: .jpg, .png, .webp. Max size 5 MB.
              </span>
            </div>

            <div style={{ flex: "2 1 300px" }}>
              <input
                type="text"
                placeholder="Caption (e.g. Center Court with floodlights)"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--outline-variant)",
                  backgroundColor: "var(--surface-container-low)",
                  fontSize: "13px",
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "13px",
                  opacity: !selectedFile || uploading ? 0.6 : 1,
                  cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>

          {filePreview && (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={filePreview}
                alt="Upload preview"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--outline-variant)",
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--on-surface-variant)" }}>
                Ready to upload: {selectedFile?.name} ({(selectedFile?.size! / 1024).toFixed(0)} KB)
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--spacing-12)",
            backgroundColor: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>No photos uploaded yet</div>
          <p style={{ color: "var(--outline)", fontSize: "13px", maxWidth: "400px", margin: "8px auto 0" }}>
            Add high quality photos of your courts, facilities, and clubhouse to attract players.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {photos.map((photo, index) => {
            const isEditing = editingPhotoId === photo.id;
            const isDeleting = deletingPhotoId === photo.id;

            return (
              <div
                key={photo.id}
                style={{
                  backgroundColor: "var(--surface-container-lowest)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--outline-variant)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                {/* Photo Image Container */}
                <div style={{ position: "relative", width: "100%", height: "200px", backgroundColor: "#000" }}>
                  <img
                    src={photo.url}
                    alt={photo.caption || "Club Photo"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    #{photo.display_order + 1}
                  </div>
                </div>

                {/* Photo Details */}
                <div style={{ padding: "var(--spacing-4)", flex: 1, display: "flex", flexDirection: "column" }}>
                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                        Caption:
                      </label>
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Caption"
                        style={{
                          padding: "6px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--outline-variant)",
                          fontSize: "13px",
                        }}
                      />
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--outline)" }}>
                        Display Order:
                      </label>
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--outline-variant)",
                          fontSize: "13px",
                          width: "80px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          onClick={() => handleSaveEdit(photo.id)}
                          disabled={updatingPhoto}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPhotoId(null)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--surface-container-high)",
                            color: "var(--on-surface)",
                            fontSize: "12px",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                        {photo.caption || <span style={{ color: "var(--outline)", fontStyle: "italic" }}>No caption</span>}
                      </div>
                      {photo.created_at && (
                        <div style={{ fontSize: "11px", color: "var(--outline)" }}>
                          Uploaded {new Date(photo.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions footer */}
                  {!isEditing && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "var(--spacing-4)",
                        paddingTop: "var(--spacing-3)",
                        borderTop: "1px solid var(--outline-variant)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => handleMoveOrder(photo, "up")}
                          disabled={index === 0}
                          title="Move earlier"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--surface-container)",
                            fontSize: "11px",
                            opacity: index === 0 ? 0.3 : 1,
                          }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveOrder(photo, "down")}
                          disabled={index === photos.length - 1}
                          title="Move later"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--surface-container)",
                            fontSize: "11px",
                            opacity: index === photos.length - 1 ? 0.3 : 1,
                          }}
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleStartEdit(photo)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--surface-container-high)",
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {isDeleting ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleDelete(photo.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--error)",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingPhotoId(null)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--surface-container-high)",
                              fontSize: "11px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingPhotoId(photo.id)}
                          style={{
                            padding: "4px 8px",
                            color: "var(--error)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
