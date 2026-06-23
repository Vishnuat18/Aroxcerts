window.showAppToast = (message, type = "error") => {
  let container = document.getElementById("app-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "app-toast-container";
    container.style.cssText = "position:fixed;bottom:30px;right:30px;z-index:999999;display:flex;flex-direction:column;gap:12px;pointer-events:none;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const bg = type === "error" ? "#EF4444" : type === "success" ? "#10B981" : "#3B82F6";
  const icon = type === "error" 
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>` 
    : type === "success" 
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` 
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  
  toast.style.cssText = `background:#fff;color:#1e293b;padding:16px 20px;border-left:5px solid ${bg};border-radius:10px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05);font-family:'Inter', sans-serif;font-size:14px;font-weight:600;display:flex;align-items:center;gap:14px;transform:translateX(120%);transition:transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);pointer-events:auto;min-width:300px;max-width:420px;line-height:1.5;`;
  toast.innerHTML = `<span style="color:${bg};display:flex;align-items:center;flex-shrink:0;">${icon}</span><span style="flex:1;">${message}</span>`;
  
  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  closeBtn.style.cssText = "background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:4px;margin-left:auto;flex-shrink:0;transition:opacity 0.2s;";
  closeBtn.onmouseover = () => closeBtn.style.opacity = "0.7";
  closeBtn.onmouseout = () => closeBtn.style.opacity = "1";
  closeBtn.onclick = () => {
    toast.style.transform = "translateX(120%)";
    setTimeout(() => toast.remove(), 400);
  };
  toast.appendChild(closeBtn);
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => requestAnimationFrame(() => toast.style.transform = "translateX(0)"));
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.transform = "translateX(120%)";
      setTimeout(() => toast.remove(), 400);
    }
  }, 5000);
};

// Override window.alert globally
window.alert = (msg) => {
  const isSuccess = msg.toLowerCase().includes("success");
  window.showAppToast(msg, isSuccess ? "success" : "error");
};
