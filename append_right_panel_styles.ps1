$styles = @"
/* ==========================================================================
   RIGHT PANEL: DATABASE AND EXPORTS
   ========================================================================== */
.database-panel {
  width: 340px;
  background-color: #ffffff;
  border-left: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-shadow: -4px 0 15px rgba(0,0,0,0.03);
  z-index: 10;
  overflow: hidden;
}

.db-panel-header {
  padding: 25px;
  border-bottom: 1px solid #E2E8F0;
  background: var(--bg-light);
}

.db-panel-header h2 {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-navy);
  margin-bottom: 5px;
}

.db-panel-header p {
  font-size: 12px;
  color: #718096;
}

.db-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f8fafc;
}

.db-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.db-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border-color: var(--primary-gold);
}

.db-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.db-item-id {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-gold);
  background: rgba(212, 175, 55, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
}

.db-item-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-navy);
  margin-bottom: 4px;
}

.db-item-course {
  font-size: 12px;
  color: #4a5568;
  margin-bottom: 10px;
}

.db-item-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-edit {
  background: var(--bg-light);
  color: var(--primary-navy);
  border-color: #cbd5e0;
}
.btn-edit:hover {
  background: #e2e8f0;
}

.btn-delete {
  background: #fff5f5;
  color: #e53e3e;
  border-color: #fed7d7;
}
.btn-delete:hover {
  background: #fed7d7;
}

.db-panel-footer {
  padding: 20px;
  background: #ffffff;
  border-top: 1px solid #E2E8F0;
}
"@

Add-Content -Path "d:\Certificate\style.css" -Value $styles
