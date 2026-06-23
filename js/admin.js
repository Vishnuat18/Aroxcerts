import { db, auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const DB_COLLECTION = 'aroxtech_certificates';

document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('loginModal');
  const appContainer = document.getElementById('appContainer');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const loginError = document.getElementById('loginError');
  const btnLogout = document.getElementById('btnLogout');
  const adminUserEmail = document.getElementById('adminUserEmail');

  // --- Auth Logic ---
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginModal.style.display = 'none';
      appContainer.style.display = 'flex';
      adminUserEmail.textContent = user.email;
      loadDashboardData();
    } else {
      loginModal.style.display = 'flex';
      appContainer.style.display = 'none';
      adminUserEmail.textContent = '';
    }
  });

  btnLoginSubmit.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if (!email || !password) {
      loginError.textContent = "Enter email and password";
      return;
    }
    
    try {
      btnLoginSubmit.textContent = "Signing In...";
      await signInWithEmailAndPassword(auth, email, password);
      loginError.textContent = "";
    } catch (error) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        loginError.textContent = "";
      } catch (createError) {
        loginError.textContent = "Invalid credentials. Please try again.";
        console.error(createError);
      }
    } finally {
      btnLoginSubmit.textContent = "Sign In";
    }
  });

  btnLogout.addEventListener('click', async () => {
    await signOut(auth);
  });

  // --- Dashboard Logic ---
  const statTotal = document.getElementById('statTotal');
  const statVerified = document.getElementById('statVerified');
  const statMonthly = document.getElementById('statMonthly');
  const dbTableBody = document.getElementById('dbTableBody');
  const dbSearch = document.getElementById('dbSearch');

  let allCertificates = [];

  async function loadDashboardData() {
    try {
      const q = query(collection(db, DB_COLLECTION), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      allCertificates = [];
      let verifiedCount = 0;
      let monthlyCount = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.id = docSnap.id;
        allCertificates.push(data);
        
        // Stats
        verifiedCount += (data.verifiedCount || 0);
        
        const dateObj = new Date(data.timestamp);
        if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
          monthlyCount++;
        }
      });

      statTotal.textContent = allCertificates.length;
      statVerified.textContent = verifiedCount;
      statMonthly.textContent = monthlyCount;

      renderTable(allCertificates);

    } catch (e) {
      console.error("Error loading dashboard data:", e);
      dbTableBody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #E53E3E;">Error loading data. Check console.</td></tr>';
    }
  }

  function renderTable(dataArray) {
    dbTableBody.innerHTML = '';
    if (dataArray.length === 0) {
      dbTableBody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #A0AEC0;">No certificates found.</td></tr>';
      return;
    }

    dataArray.forEach(cert => {
      const isRevoked = cert.status === 'REVOKED';
      const tr = document.createElement('tr');
      tr.className = 'db-row';
      
      const issueDateObj = new Date(cert.timestamp);
      const formattedDate = !isNaN(issueDateObj) ? issueDateObj.toLocaleDateString('en-GB') : 'Unknown';

      tr.innerHTML = `
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-weight: 600; color: var(--primary-navy);">${cert.cert_id || 'N/A'}</td>
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0; font-weight: 500;">${cert.student_name || 'N/A'}</td>
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0; color: #4A5568;">${cert.internship_details || 'N/A'}</td>
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0; color: #718096;">${formattedDate}</td>
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0;">
          <span class="status-badge ${isRevoked ? 'revoked' : ''}">${isRevoked ? 'REVOKED' : (cert.verifiedCount || 0) + ' Scans'}</span>
        </td>
        <td style="padding: 12px 20px; border-bottom: 1px solid #E2E8F0; text-align: right;">
          <a href="verify.html?id=${cert.cert_id}" target="_blank" class="action-btn btn-view" style="text-decoration: none;">View</a>
          <button class="action-btn btn-revoke" data-id="${cert.id}" data-status="${cert.status || 'VALID'}">
            ${isRevoked ? 'Restore' : 'Revoke'}
          </button>
        </td>
      `;
      dbTableBody.appendChild(tr);
    });

    // Attach revoke event listeners
    document.querySelectorAll('.btn-revoke').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const currentStatus = e.target.getAttribute('data-status');
        const newStatus = currentStatus === 'REVOKED' ? 'VALID' : 'REVOKED';
        
        if (confirm(`Are you sure you want to ${newStatus === 'REVOKED' ? 'revoke' : 'restore'} this certificate?`)) {
          await updateDoc(doc(db, DB_COLLECTION, id), { status: newStatus });
          loadDashboardData(); // Refresh
        }
      });
    });
  }

  // --- Search Logic ---
  dbSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allCertificates.filter(c => 
      (c.cert_id || '').toLowerCase().includes(term) ||
      (c.student_name || '').toLowerCase().includes(term) ||
      (c.internship_details || '').toLowerCase().includes(term)
    );
    renderTable(filtered);
  });
});
