// Message.jsx
import { useEffect, useState } from "react";
import styles from "./UserProfile.module.css";

export default function PasswordMessage({ type = "success", text, duration = 3000, clear }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!text) return;
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      clear && clear();
    }, duration);

    return () => clearTimeout(timer);
  }, [text, duration]);
  if (!text) return null;

  return (
    <p
      className={`${styles.message} ${styles[type]} ${visible ? styles.show : styles.hide
        }`}
    >
      {text}
    </p>
  );
}
