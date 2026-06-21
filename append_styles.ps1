$styles = @"
/* ==========================================================================
   DATABASE MODAL STYLES
   ========================================================================== */
.db-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 31, 68, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(4px);
}
.db-modal-overlay.active {
  opacity: 1;
  pointer-events: all;
}
.db-modal-content {
  background: #ffffff;
  width: 90%;
  max-width: 900px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}
.db-modal-header {
  padding: 20px;
  background: #0A1F44;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.db-modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}
.db-close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
}
.db-modal-body {
  padding: 20px;
  overflow-y: auto;
}
.db-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.db-table th, .db-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #333;
}
.db-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #0A1F44;
}
.db-modal-footer {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
"@

Add-Content -Path "d:\Certificate\style.css" -Value $styles
