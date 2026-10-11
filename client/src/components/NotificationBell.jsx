import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function NotificationBell() {
  const [data, setData] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();

  const load = () =>
    api
      .get("/notifications")
      .then((res) => setData(res.data))
      .catch(() => {}); // bell kharab ho to poora page na ruke

  // Har 30 second mein naya check
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  // Bahar click karne par band
  useEffect(() => {
    const close = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      await api.post(`/notifications/${n._id}/read`).catch(() => {});
      load();
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await api.post("/notifications/read-all").catch(() => {});
    load();
  };

  return (
    <div className="bell" ref={box}>
      <button
        className="bell-btn"
        aria-label="Notifications"
        onClick={() => {
          setOpen(!open);
          if (!open) load();
        }}
      >
        Notifications
        {data.unread > 0 && <span className="bell-count">{data.unread}</span>}
      </button>

      {open && (
        <div className="bell-menu">
          <div className="bell-head">
            <strong>Notifications</strong>
            {data.unread > 0 && (
              <button className="link-btn" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {data.items.length === 0 && <p className="bell-empty">Nothing yet.</p>}
          {data.items.map((n) => (
            <button key={n._id} className={n.read ? "bell-item" : "bell-item unread"} onClick={() => openItem(n)}>
              <span>{n.message}</span>
              <small>{ago(n.createdAt)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
