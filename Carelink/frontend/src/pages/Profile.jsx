import React, { useMemo, useState } from "react";
import { useAuth } from "../context/Auth.jsx";
import api from "../services/api";
import { toast } from "react-toastify";
import { USERS_PROFILE } from "../services/endpoints";

export default function Profile() {
  const { user, loading, checkAuthStatus } = useAuth();

  const initial = useMemo(() => {
    return {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    };
  }, [user]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  // when user loads/changes, sync form (only if not editing)
  React.useEffect(() => {
    if (!editing) setForm(initial);
  }, [initial, editing]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async () => {
    try {
      setSaving(true);

      // ✅ adjust endpoint if your project uses something else
      const { data } = await api.put(USERS_PROFILE, {
        name: form.name,
        phone: form.phone,
      });

      if (data?.success) {
        toast.success("Profile updated");
        setEditing(false);
        await checkAuthStatus(); // refresh /auth/me user
      } else {
        toast.error(data?.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Loading profile...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Profile</h2>
        <p>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Profile</h2>

      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{user.name || "—"}</div>
            <div style={{ color: "var(--color-muted)" }}>{user.email || "—"}</div>
            {user.role && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                Role: <b>{user.role}</b>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {!editing ? (
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditing(false);
                    setForm(initial);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Full Name</label>
              <input name="name" value={form.name} onChange={onChange} className="input" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} className="input" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Email (read-only)</label>
              <input name="email" value={form.email} className="input" disabled />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
