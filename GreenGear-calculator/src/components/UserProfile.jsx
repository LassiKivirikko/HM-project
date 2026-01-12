import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import styles from "./UserProfile.module.css";
import { KeyRound } from "lucide-react";
import PasswordMessage from "./PasswordMessage.jsx";
import { useNavigate } from "react-router-dom";


const API_BASE = import.meta.env.VITE_API_URL || "";
const BASE_URL = `${API_BASE}/api/v1`;


export default function UserProfile() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const auth = useAuth();
  const navigate = useNavigate();
  const handleMessageClear = () => {
    setError('');
    setSuccess('');
  }
  const handlePassWordChange = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      setSuccess('');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword })
      });
      if (response.ok) {
        setSuccess('Password changed successfully');
        setError('');
        setIsEditing(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Error changing password');
        setSuccess('');
      }
    } catch (err) {
      setError('Error changing password');
      return;
    }




  }
  return (
    <section className={styles.section}>
      <button
        onClick={() => navigate('/')}
      >back
      </button>
      <div className={styles.profileContainer}>

        <h2>User Profile</h2>
        <div>
          <p>username: {user?.username}</p>
        </div>
        <div className={styles.changePassword}>
          <p onClick={() => setIsEditing(!isEditing)}>change password </p>
          <KeyRound className={styles.keyIcon} />
        </div>
        <div className={styles.passwordChangeContainer}>
          {isEditing && (
            <form onSubmit={handlePassWordChange} className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  Current Password
                  <input type="password" name="currentPassword" required />
                </label>
                <label>
                  New Password
                  <input type="password" name="newPassword" required />
                </label>
                <label>
                  Confirm Password
                  <input type="password" name="confirmPassword" required />
                </label>
                <div className={styles.buttonGroup}>
                  <button type="submit">save</button>
                  <button onClick={() => setIsEditing(false)}>cancel</button>
                </div>

              </div>
            </form>
          )}
          <PasswordMessage type="error" text={error} clear={handleMessageClear} />
          <PasswordMessage type="success" text={success} clear={handleMessageClear} />

        </div>
      </div>
      <div className={styles.logoutButton}>
        <button
          className={styles.logoutButton}
          onClick={auth.logout}
        >
          Logout
        </button>
      </div>
    </section>
  )
}
