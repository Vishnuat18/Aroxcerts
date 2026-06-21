$styles = @"
/* ==========================================================================
   LOGIN & PROFILE STYLES
   ========================================================================== */
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 31, 68, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(8px);
}
.login-overlay.active {
  opacity: 1;
  pointer-events: all;
}
.login-box {
  background: #ffffff;
  padding: 40px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}
.login-logo {
  height: 60px;
  margin-bottom: 20px;
  object-fit: contain;
}
.login-box h2 {
  color: var(--primary-navy);
  margin-bottom: 10px;
  font-size: 22px;
}
.login-box p {
  color: var(--text-body);
  margin-bottom: 20px;
  font-size: 14px;
}
.login-box input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 16px;
}
.login-box input:focus {
  outline: none;
  border-color: var(--primary-gold);
}
.login-error {
  color: #ff4d4d;
  font-size: 13px;
  margin-bottom: 15px;
  min-height: 20px;
}
.profile-icon {
  position: fixed;
  top: 20px;
  right: 30px;
  background: #ffffff;
  padding: 8px 16px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  z-index: 1000;
  color: var(--primary-navy);
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(212, 175, 55, 0.3);
}
.profile-icon svg {
  color: var(--primary-gold);
}
"@

Add-Content -Path "d:\Certificate\style.css" -Value $styles
