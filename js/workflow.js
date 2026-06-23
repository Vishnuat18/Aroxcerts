import { collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DB_COLLECTION = 'aroxtech_certificates';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const certIdInput = document.getElementById('certIdInput');
  const btnVerifyNow = document.getElementById('btnVerifyNow');
  const btnScanQr = document.getElementById('btnScanQr');
  const btnTryAgain = document.getElementById('btnTryAgain');
  const btnVerifyAnother = document.getElementById('btnVerifyAnother');
  
  // Detail Fields (For Card 4)
  const vdCertId = document.getElementById('vdCertId');
  const vdName = document.getElementById('vdName');
  const vdProgram = document.getElementById('vdProgram');
  const vdDomain = document.getElementById('vdDomain');
  const vdDuration = document.getElementById('vdDuration');
  const vdIssueDate = document.getElementById('vdIssueDate');
  const tlIssueDate = document.getElementById('tlIssueDate');

  // Certificate DOM Nodes (For Card 5 Preview)
  const viewName = document.getElementById('viewName');
  const viewCourse = document.getElementById('viewCourse');
  const viewDomain = document.getElementById('viewDomain');
  const viewStartDate = document.getElementById('viewStartDate');
  const viewEndDate = document.getElementById('viewEndDate');
  const viewDuration = document.getElementById('viewDuration');
  const viewIssueDate = document.getElementById('viewIssueDate');
  const viewCertId = document.getElementById('viewCertId');
  const viewVerifyUrl = document.getElementById('viewVerifyUrl');

  // Next Buttons
  const btnViewDetails = document.getElementById('btnViewDetails');
  const btnViewCert = document.getElementById('btnViewCert');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');

  // Utility to format dates securely
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // State Machine Arrays
  const allSteps = [1, 2, 3, 4, 5, 6, 7, 8].map(i => document.getElementById(`step${i}`));

  const resetWorkflow = () => {
    allSteps.forEach(el => {
      if (el) {
        el.classList.add('inactive');
        el.classList.remove('active');
      }
    });
    if (allSteps[0]) {
      allSteps[0].classList.remove('inactive');
      allSteps[0].classList.add('active');
    }
    certIdInput.value = '';
  };

  const activateStep = (stepNum) => {
    // Hide all steps
    allSteps.forEach(el => {
      if (el) {
        el.classList.add('inactive');
        el.classList.remove('active');
      }
    });
    // Show target step
    const el = document.getElementById(`step${stepNum}`);
    if (el) {
      el.classList.remove('inactive');
      el.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Setup Next button listeners
  if (btnViewDetails) btnViewDetails.addEventListener('click', () => activateStep(4));
  if (btnViewCert) btnViewCert.addEventListener('click', () => activateStep(5));

  // PDF Download Logic
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      const element = document.getElementById('certificate');
      if (!element) return;
      
      const opt = {
        margin: 0,
        filename: `${vdName.textContent}_Certificate.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      const originalTransform = element.style.transform;
      element.style.transform = 'none'; // reset scale for clear render
      
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform;
      });
    });
  }

  // Setup Back button listeners
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetStep = parseInt(e.target.getAttribute('data-back-to'));
      if (targetStep) activateStep(targetStep);
    });
  });

  // ==========================================================================
  // VERIFICATION LOGIC
  // ==========================================================================
  const verifyCertificate = async () => {
    const certId = certIdInput.value.trim();
    if (!certId) {
      alert("Please enter a Certificate ID.");
      return;
    }

    // Move to step 2
    activateStep(2);
    
    // Simulate 2 seconds of loading for effect
    await new Promise(r => setTimeout(r, 2000));

    try {
      const q = query(collection(db, DB_COLLECTION));
      const querySnapshot = await getDocs(q);
      
      let foundCert = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.cert_id === certId || doc.id === certId) {
          foundCert = data;
        }
      });

      if (foundCert) {
        // Map Firestore fields to UI
        const issueDt = formatDate(foundCert.issue_date || foundCert.createdAt);
        const startDt = formatDate(foundCert.start_date);
        const endDt = formatDate(foundCert.end_date);
        const nameText = foundCert.student_name || foundCert.candidateName || '--';
        const progText = foundCert.internship_details || foundCert.program || '--';
        const domainText = foundCert.domain || '--';
        const durText = foundCert.total_days || foundCert.duration || '--';
        const certIdText = foundCert.cert_id || certId;

        // Populate Card 4 Details
        if (vdCertId) vdCertId.textContent = certIdText;
        if (vdName) vdName.textContent = nameText;
        if (vdProgram) vdProgram.textContent = progText;
        if (vdDomain) vdDomain.textContent = domainText;
        if (vdDuration) vdDuration.textContent = durText;
        if (vdIssueDate) vdIssueDate.textContent = issueDt;
        if (tlIssueDate) tlIssueDate.textContent = issueDt;

        // Populate Actual Certificate DOM in Card 5
        if (viewName) viewName.textContent = nameText;
        if (viewCourse) viewCourse.textContent = progText;
        if (viewDomain) viewDomain.textContent = domainText;
        if (viewStartDate) viewStartDate.textContent = startDt;
        if (viewEndDate) viewEndDate.textContent = endDt;
        if (viewDuration) viewDuration.textContent = durText;
        if (viewIssueDate) viewIssueDate.textContent = issueDt;
        if (viewCertId) viewCertId.textContent = certIdText;
        if (viewVerifyUrl) viewVerifyUrl.textContent = `aroxtech.com/verify?id=${certIdText}`;

        // Show Success Step (user must click next from here)
        activateStep(3);
      } else {
        // Not Found
        activateStep(8);
      }

    } catch (error) {
      console.error("Verification Error:", error);
      alert("Failed to connect to database. Make sure your internet connection is active and Firestore is enabled.");
      resetWorkflow();
    }
  };

  // Event Listeners
  btnVerifyNow.addEventListener('click', verifyCertificate);
  
  certIdInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') verifyCertificate();
  });

  btnTryAgain.addEventListener('click', resetWorkflow);
  btnVerifyAnother.addEventListener('click', resetWorkflow);

  // Auto-fill from URL param if exists
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get('id');
  if (idFromUrl) {
    certIdInput.value = idFromUrl;
    verifyCertificate();
  }

  // Modal Logic
  window.openCertModal = () => {
    const modal = document.getElementById('certModal');
    const certWrapper = document.getElementById('certTransformWrapper');
    const modalContainer = modal.querySelector('div');
    
    // Move the cert into the modal container
    if (modalContainer && certWrapper) {
      modalContainer.appendChild(certWrapper);
      
      // Scale it to 0.256 for bigger view
      certWrapper.style.transform = 'scale(0.256)';
      
      modal.style.display = 'flex';
      
      // Animate opacity
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
      }, 10);
    }
  };

  window.closeCertModal = () => {
    const modal = document.getElementById('certModal');
    const certWrapper = document.getElementById('certTransformWrapper');
    const originalContainer = document.querySelector('#certPreviewBox > div');
    
    if (originalContainer && certWrapper) {
      modal.style.opacity = '0';
      
      setTimeout(() => {
        // Move it back
        originalContainer.appendChild(certWrapper);
        // Scale back to 0.129
        certWrapper.style.transform = 'scale(0.129)';
        modal.style.display = 'none';
      }, 300); // match transition duration
    }
  };
});
