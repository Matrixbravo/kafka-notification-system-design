import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

function App() {
  const [userId] = useState("user123");
  const [notification, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:4000/notifications/${userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await fetch(`http://localhost:4000/notifications/${userId}/unread-count`);
      const data = await res.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  const markARead = async (id) => {
    await fetch(`http://localhost:4000/notifications/${id}/read`, {
      method: "POST"
    });

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    loadUnreadCount();
  };

  useEffect(() => {
    socket.emit("register", userId);

    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    loadNotifications();
    loadUnreadCount();

    return () => {
      socket.off("new_notifiction");
    };
  }, []);

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Notification Center</h1>
      <h2>User: {userId}</h2>
      <h3>Unread: {unreadCount}</h3>

      {notification.length === 0 ? (
        <p>No notification yet.</p>
      ) : (
        notification.map((n) => (
          <div
            key={n.id}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "8px",
              background: n.is_read ? "#f7f7f7" : "#fff"
            }}
          >
            <h4>{n.title}</h4>
            <p>{n.message}</p>
            <small>Type: {n.type}</small>
            <br />
            {!n.is_read && (
              <button onClick={() => markARead(n.id)} style={{ marginTop: "8px" }}>
                Mark as Read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;