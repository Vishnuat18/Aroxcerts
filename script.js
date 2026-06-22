/* ==========================================================================
   Certificate Generator Business Logic
   Implements live bindings, custom inputs, native date formatting,
   form validation alerts, scale previewing, and PDF/PNG exports.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBvJuEq70b1JGqC83YFJy_4780B24S0bM",
  authDomain: "arox-48513.firebaseapp.com",
  projectId: "arox-48513",
  storageBucket: "arox-48513.firebasestorage.app",
  messagingSenderId: "317254519087",
  appId: "1:317254519087:web:8d0478c26094cc470739da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DB_COLLECTION = 'aroxtech_certificates';

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     AUTHENTICATION LOGIC
     ========================================================================== */
  const loginModal = document.getElementById('loginModal');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const loginError = document.getElementById('loginError');
  const profileIcon = document.getElementById('profileIcon');
  const appContainer = document.getElementById('appContainer');

  const checkAuth = () => {
    if (sessionStorage.getItem('arox_admin_auth') === 'true') {
      if(loginModal) loginModal.classList.remove('active');
      if(profileIcon) profileIcon.style.display = 'flex';
      if(appContainer) appContainer.style.display = 'flex';
    } else {
      if(loginModal) loginModal.classList.add('active');
      if(profileIcon) profileIcon.style.display = 'none';
      if(appContainer) appContainer.style.display = 'none';
    }
  };

  const attemptLogin = () => {
    if (loginPassword.value === 'arox2026') {
      sessionStorage.setItem('arox_admin_auth', 'true');
      if(loginModal) loginModal.classList.remove('active');
      if(profileIcon) profileIcon.style.display = 'flex';
      if(appContainer) appContainer.style.display = 'flex';
      if(loginError) loginError.textContent = '';
      
      // Calculate layout now that it's visible
      if (typeof adjustPreviewScale === 'function') setTimeout(adjustPreviewScale, 50);
    } else {
      if(loginError) loginError.textContent = 'Incorrect password.';
      if(loginPassword) loginPassword.value = '';
    }
  };

  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', attemptLogin);
  }
  if (loginPassword) {
    loginPassword.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  checkAuth();

  // --- HTML Elements Cache ---
  const scaleWrapper = document.getElementById('certScaleWrapper');
  const certificate = document.getElementById('certificate');
  const previewPanel = document.querySelector('.preview-panel');
  
  const inputName = document.getElementById('inputName');
  const viewName = document.getElementById('viewName');
  
  const selectCourse = document.getElementById('selectCourse');
  const inputCourse = document.getElementById('inputCourse');
  const viewCourse = document.getElementById('viewCourse');
  
  const inputStartDate = document.getElementById('inputStartDate');
  const viewStartDate = document.getElementById('viewStartDate');
  
  const inputEndDate = document.getElementById('inputEndDate');
  const viewEndDate = document.getElementById('viewEndDate');
  
  const inputDuration = document.getElementById('inputDuration');
  const viewDuration = document.getElementById('viewDuration');
  
  const selectDomain = document.getElementById('selectDomain');
  const inputDomain = document.getElementById('inputDomain');
  const viewDomain = document.getElementById('viewDomain');
  
  const inputIssueDate = document.getElementById('inputIssueDate');
  const viewIssueDate = document.getElementById('viewIssueDate');
  
  const inputCertId = document.getElementById('inputCertId');
  const viewCertId = document.getElementById('viewCertId');
  
  const inputVerifyUrl = document.getElementById('inputVerifyUrl');
  const viewVerifyUrl = document.getElementById('viewVerifyUrl');
  
  const inputDescription = document.getElementById('inputDescription');
  const viewDescription = document.getElementById('viewDescription');

  const inputCertYear = document.getElementById('inputCertYear');
  const inputCertNum = document.getElementById('inputCertNum');

  const btnGenId = document.getElementById('btnGenId');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnPrint = document.getElementById('btnPrint');

  /* ==========================================================================
     DATE FORMATTING UTILITY
     Converts native YYYY-MM-DD to DD MONTH YYYY in uppercase format
     ========================================================================== */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    
    const standardMonths = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    
    const monthName = standardMonths[monthIndex] || '';
    const formattedDay = day.padStart(2, '0');
    return `${formattedDay} ${monthName} ${year}`;
  };

  /* ==========================================================================
     PREVIEW LIVE SYNCING: Event Listeners & Binding Helpers
     ========================================================================== */
  
  // Direct text inputs syncing helper
  const syncInput = (inputEl, viewEl, placeholderText, callback = null) => {
    const updateView = () => {
      viewEl.textContent = inputEl.value.trim() || placeholderText;
      if (callback) callback(inputEl.value);
    };
    inputEl.addEventListener('input', updateView);
    updateView(); // Initialize view text on load
  };

  // Helper to sync date input values with formatted output
  const syncDateInput = (inputEl, viewEl, placeholderText, callback = null) => {
    const updateView = () => {
      const formatted = formatDate(inputEl.value);
      viewEl.textContent = formatted || placeholderText;
      if (callback) callback(inputEl.value);
    };
    inputEl.addEventListener('input', updateView);
    inputEl.addEventListener('change', updateView);
    updateView(); // Initialize view text on load
  };

  // Ensure inputs start completely empty to show placeholders
  if (!inputName.value) inputName.value = "";
  if (!selectCourse.value) selectCourse.value = "";
  if (!inputCourse.value) inputCourse.value = "";
  if (!inputStartDate.value) inputStartDate.value = "";
  if (!inputEndDate.value) inputEndDate.value = "";
  if (!inputDuration.value) inputDuration.value = "";
  if (!selectDomain.value) selectDomain.value = "";
  if (!inputDomain.value) inputDomain.value = "";
  if (!inputIssueDate.value) inputIssueDate.value = "";
  if (!inputVerifyUrl.value) inputVerifyUrl.value = "";

  // Handle Certificate ID Multi-part Logic
  const updateCertId = () => {
    if (inputCertYear && inputCertNum && inputCertId) {
      inputCertId.value = `AT/INT/${inputCertYear.value.trim()}/${inputCertNum.value.trim()}`;
      inputCertId.dispatchEvent(new Event('input'));
    }
  };
  if (inputCertYear) inputCertYear.addEventListener('input', updateCertId);
  if (inputCertNum) inputCertNum.addEventListener('input', updateCertId);

  // Bind individual inputs to their preview segments with placeholders
  syncInput(inputName, viewName, '[Candidate Name]');
  syncInput(inputCourse, viewCourse, '[Internship/Course Title]');
  syncDateInput(inputStartDate, viewStartDate, '[Start Date]');
  syncDateInput(inputEndDate, viewEndDate, '[End Date]');
  syncInput(inputDuration, viewDuration, '[Duration]');
  syncInput(inputDomain, viewDomain, '[Domain]');
  syncDateInput(inputIssueDate, viewIssueDate, '[Date of Issue]');
  syncInput(inputCertId, viewCertId, '[Certificate ID]');
  
  if (inputCertYear && inputCertNum) updateCertId(); // Init

  // Handle selects dropdown toggle & sync logic for Course Title
  const handleCourseChange = () => {
    if (selectCourse.value === 'other') {
      inputCourse.style.display = 'block';
      viewCourse.textContent = inputCourse.value.trim() || '[Internship/Course Title]';
    } else if (selectCourse.value === '') {
      inputCourse.style.display = 'none';
      inputCourse.value = '';
      viewCourse.textContent = '[Internship/Course Title]';
    } else {
      inputCourse.style.display = 'none';
      inputCourse.value = selectCourse.value;
      viewCourse.textContent = selectCourse.value;
    }
  };
  selectCourse.addEventListener('change', handleCourseChange);
  handleCourseChange(); // Trigger on load

  // Handle selects dropdown toggle & sync logic for Domain
  const handleDomainChange = () => {
    if (selectDomain.value === 'other') {
      inputDomain.style.display = 'block';
      viewDomain.textContent = inputDomain.value.trim() || '[Domain]';
    } else if (selectDomain.value === '') {
      inputDomain.style.display = 'none';
      inputDomain.value = '';
      viewDomain.textContent = '[Domain]';
    } else {
      inputDomain.style.display = 'none';
      inputDomain.value = selectDomain.value;
      viewDomain.textContent = selectDomain.value;
    }
  };
  selectDomain.addEventListener('change', handleDomainChange);
  handleDomainChange(); // Trigger on load

  // Sync description (converting newlines to HTML line breaks)
  const syncDescription = () => {
    const defaultText = "During this internship, he/she was found to be dedicated,\nenthusiastic and hardworking.\nWe wish him/her all the best for future endeavors.";
    const textVal = inputDescription.value.trim() || defaultText;
    viewDescription.innerHTML = textVal.replace(/\n/g, '<br>');
  };
  inputDescription.addEventListener('input', syncDescription);
  syncDescription(); // Initial sync on load

  // Sync verification URL to the preview link
  inputVerifyUrl.addEventListener('input', (e) => {
    const urlVal = e.target.value.trim();
    const finalUrl = urlVal.startsWith('http') ? urlVal : (urlVal ? `https://${urlVal}` : '');
    viewVerifyUrl.textContent = finalUrl || '[Verification URL]';
  });
  // Initialize on load
  const initialUrl = inputVerifyUrl.value.trim();
  viewVerifyUrl.textContent = initialUrl ? (initialUrl.startsWith('http') ? initialUrl : `https://${initialUrl}`) : '[Verification URL]';

  /* ==========================================================================
     FORM VALIDATION PIPELINE
     Checks for missing values and pops up alert dialogue to focus missing inputs
     ========================================================================== */
  function validateFields() {
    // Check dropdowns first
    if (selectCourse.value === '') {
      alert('Please select an Internship Title!');
      selectCourse.focus();
      return false;
    }
    if (selectCourse.value === 'other' && !inputCourse.value.trim()) {
      alert('Please enter a custom Internship Title!');
      inputCourse.focus();
      return false;
    }

    if (selectDomain.value === '') {
      alert('Please select a Domain!');
      selectDomain.focus();
      return false;
    }
    if (selectDomain.value === 'other' && !inputDomain.value.trim()) {
      alert('Please enter a custom Domain!');
      inputDomain.focus();
      return false;
    }

    const requiredFields = [
      { input: inputName, name: 'Candidate Name' },
      { input: inputDuration, name: 'Duration' },
      { input: inputStartDate, name: 'Start Date' },
      { input: inputEndDate, name: 'End Date' },
      { input: inputIssueDate, name: 'Date of Issue' },
      { input: inputCertId, name: 'Certificate ID' },
      { input: inputVerifyUrl, name: 'Verification URL' }
    ];

    for (const field of requiredFields) {
      if (!field.input.value.trim()) {
        alert(`Please enter a valid ${field.name}!`);
        field.input.focus();
        return false;
      }
    }

    return true;
  }

  /* ==========================================================================
     AUTO-GENERATE UNIQUE CERTIFICATE ID
     ========================================================================== */
  const advanceCertId = () => {
    const DB_KEY = 'aroxtech_certificates';
    const records = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const year = inputCertYear ? (inputCertYear.value.trim() || '2026') : '2026';
    let nextNum = 101;
    
    const prefix = `AT/INT/${year}/`;
    const yearRecords = records.filter(r => r.cert_id && r.cert_id.startsWith(prefix));
    
    if (yearRecords.length > 0) {
      const highestNum = yearRecords.reduce((max, r) => {
        const seqStr = r.cert_id.split('/').pop();
        const seqNum = parseInt(seqStr, 10);
        return (!isNaN(seqNum) && seqNum > max) ? seqNum : max;
      }, 0);
      if (highestNum >= 101) nextNum = highestNum + 1;
    }
    
    const autoNum = String(nextNum).padStart(4, '0');
    if (inputCertNum) {
      inputCertNum.value = autoNum;
      inputCertNum.dispatchEvent(new Event('input')); // trigger updateCertId
    } else if (inputCertId) {
      inputCertId.value = `${prefix}${autoNum}`;
      inputCertId.dispatchEvent(new Event('input'));
    }
  };

  btnGenId.addEventListener('click', advanceCertId);

  /* ==========================================================================
     RESPONSIVE SCALE PREVIEW PIPELINE
     ========================================================================== */
  function adjustPreviewScale() {
    if (!previewPanel || !scaleWrapper) return;
    
    const margin = 60; // Clean spacing around scaled content
    const availableWidth = previewPanel.clientWidth - margin;
    const availableHeight = previewPanel.clientHeight - margin;
    
    // Certificate container dimensions
    const exportWrapper = document.getElementById('export-wrapper');
    const certWidth = exportWrapper ? exportWrapper.offsetWidth : 2480;
    const certHeight = exportWrapper ? exportWrapper.offsetHeight : 3508;
    const widthScale = availableWidth / certWidth;
    const heightScale = availableHeight / certHeight;
    
    // Limit maximum scale factor to 1.0 to keep it sharp
    const scaleFactor = Math.min(widthScale, heightScale, 1.0);
    
    scaleWrapper.style.transform = `scale(${scaleFactor})`;

    // Fit preview scroller size to scaled boundary
    const scroller = scaleWrapper.parentElement;
    if (scroller) {
      scroller.style.width = `${certWidth * scaleFactor}px`;
      scroller.style.height = `${certHeight * scaleFactor}px`;
    }
  }

  // Adjust preview scaling on load and resize
  window.addEventListener('resize', adjustPreviewScale);
  adjustPreviewScale();
  // Double-check scale immediately after layout
  setTimeout(adjustPreviewScale, 100);

  /* ==========================================================================
     EXPORT LOGIC: PDF & PNG (HIGH FIDELITY)
     ========================================================================== */

  // Utility to handle temporary scaling resets during high-density capture
  function prepareCapture(callback) {
    const exportWrapper = document.getElementById('export-wrapper');
    const originalTransform = scaleWrapper.style.transform;
    const originalShadow = exportWrapper ? exportWrapper.style.boxShadow : '';
    const scroller = scaleWrapper.parentElement;
    const originalScrollerWidth = scroller ? scroller.style.width : '';
    const originalScrollerHeight = scroller ? scroller.style.height : '';
    
    // 1. Reset scale to 1 to render canvas elements at 100% resolution
    scaleWrapper.style.transform = 'none';
    if (scroller && exportWrapper) {
      scroller.style.width = `${exportWrapper.offsetWidth}px`;
      scroller.style.height = `${exportWrapper.offsetHeight}px`;
    }
    // 2. Hide shadow boundary lines during capture
    if (exportWrapper) {
      exportWrapper.style.boxShadow = 'none';
    }

    // Export validation check: verify corner bounds and reposition inward if needed
    const ribbons = [
      { el: document.querySelector('.corner-ribbon-tl'), type: 'tl' },
      { el: document.querySelector('.corner-ribbon-br'), type: 'br' }
    ];
    ribbons.forEach(ribbon => {
      if (ribbon.el) {
        const style = window.getComputedStyle(ribbon.el);
        if (ribbon.type === 'tl') {
          const topVal = parseFloat(style.top);
          const leftVal = parseFloat(style.left);
          if (topVal < 10 || isNaN(topVal)) ribbon.el.style.top = '10px';
          if (leftVal < 10 || isNaN(leftVal)) ribbon.el.style.left = '10px';
        } else if (ribbon.type === 'br') {
          const bottomVal = parseFloat(style.bottom);
          const rightVal = parseFloat(style.right);
          if (bottomVal < 10 || isNaN(bottomVal)) ribbon.el.style.bottom = '10px';
          if (rightVal < 10 || isNaN(rightVal)) ribbon.el.style.right = '10px';
        }
      }
    });

    // Helper to wait for all image loads
    const waitForImages = () => {
      const images = document.querySelectorAll('img');
      const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      return Promise.all(promises);
    };

    // Give DOM browser layout engine 150ms and wait for fonts/images to register style adjustments
    setTimeout(async () => {
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
        await waitForImages();
      } catch (e) {
        console.warn('Asset loading warning:', e);
      }

      // Hide export buttons before capture
      const exportFooter = document.querySelector('.cert-export-footer');
      if (exportFooter) exportFooter.style.display = 'none';

      callback(() => {
        // Restore styling after output completion
        scaleWrapper.style.transform = originalTransform;
        if (exportWrapper) {
          exportWrapper.style.boxShadow = originalShadow;
        }
        if (scroller && exportWrapper) {
          scroller.style.width = originalScrollerWidth;
          scroller.style.height = originalScrollerHeight;
        }
        if (exportFooter) exportFooter.style.display = 'flex';
      });
    }, 150);
  }

  // --- PNG Download (HQ) ---
  btnDownloadPng.addEventListener('click', () => {
    if (!validateFields()) return;
    prepareCapture((restoreCallback) => {
      const exportWrapper = document.getElementById('export-wrapper');
      html2canvas(exportWrapper, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        backgroundColor: '#ffffff',
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        const formattedName = inputName.value.trim().toLowerCase().replace(/\s+/g, '_');
        link.download = `${formattedName}_internship_certificate.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        restoreCallback();
      }).catch(err => {
        console.error('PNG export failed:', err);
        restoreCallback();
        alert('PNG export failed. Please check browser console.');
      });
    });
  });

  // --- PDF Download (HQ A4 Portrait) ---
  btnDownloadPdf.addEventListener('click', () => {
    if (!validateFields()) return;
    prepareCapture((restoreCallback) => {
      const exportWrapper = document.getElementById('export-wrapper');
      html2canvas(exportWrapper, {
        scale: 4,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Setup jsPDF context
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Exactly fill 210mm x 297mm
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
        
        const formattedName = inputName.value.trim().toLowerCase().replace(/\s+/g, '_');
        pdf.save(`${formattedName}_internship_certificate.pdf`);
        
        restoreCallback();
      }).catch(err => {
        console.error('PDF export failed:', err);
        restoreCallback();
        alert('PDF export failed. Please check browser console.');
      });
    });
  });

  // --- Dynamic Print Scaling ---
  window.addEventListener('beforeprint', () => {
    // Determine strict printable area that ensures 95-100% coverage
    // Safe margins subtract a bit from true A4 (794x1123)
    const printableWidth = 760; 
    const printableHeight = 1075;
    
    const certWidth = certificate.offsetWidth || 794;
    const certHeight = certificate.offsetHeight || 1123;
    
    const scaleX = printableWidth / certWidth;
    const scaleY = printableHeight / certHeight;
    const scale = Math.min(scaleX, scaleY);
    
    scaleWrapper.style.transform = `scale(${scale})`;
    scaleWrapper.style.transformOrigin = 'center center';

    // Hide the floating export buttons during print
    const exportFooter = document.querySelector('.cert-export-footer');
    if (exportFooter) exportFooter.style.display = 'none';
  });

  window.addEventListener('afterprint', () => {
    // Restore normal preview scaling
    scaleWrapper.style.transformOrigin = 'top center';
    adjustPreviewScale();

    // Show the floating export buttons after print
    const exportFooter = document.querySelector('.cert-export-footer');
    if (exportFooter) exportFooter.style.display = 'flex';
  });

  // --- Print Command ---
  btnPrint.addEventListener('click', () => {
    if (!validateFields()) return;
    window.print();
  });

  /* ==========================================================================
     AUTO DAYS CONVERTER
     ========================================================================== */
  const calculateDuration = () => {
    const startVal = inputStartDate.value;
    const endVal = inputEndDate.value;
    if (startVal && endVal) {
      const start = new Date(startVal);
      const end = new Date(endVal);
      const diffTime = end - start;
      if (diffTime >= 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const durationStr = `${diffDays} DAYS`;
        inputDuration.value = durationStr;
        viewDuration.textContent = durationStr;
      }
    }
  };
  inputStartDate.addEventListener('change', calculateDuration);
  inputEndDate.addEventListener('change', calculateDuration);

  /* ==========================================================================
     FIREBASE DATABASE & VIEWS
     ========================================================================== */
  let editingDbId = null;
  let currentDbView = 'grid'; // 'grid' or 'table'
  const btnAddDbText = document.getElementById('btnAddDbText');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  const saveToDatabase = async () => {
    if (!inputName.value.trim() || !inputCertId.value.trim()) return;

    try {
      const recordData = {
        student_name: inputName.value.trim(),
        internship_details: inputCourse.value.trim() || selectCourse.value,
        start_date: inputStartDate.value,
        end_date: inputEndDate.value,
        total_days: inputDuration.value.trim(),
        cert_id: inputCertId.value.trim(),
        timestamp: new Date().toISOString()
      };

      if (editingDbId !== null) {
        // UPDATE existing
        const docRef = doc(db, DB_COLLECTION, editingDbId);
        await setDoc(docRef, recordData, { merge: true });
        editingDbId = null;
        if (btnAddDbText) btnAddDbText.textContent = "Add to Database";
        if (btnCancelEdit) btnCancelEdit.style.display = "none";
      } else {
        // CREATE new
        recordData.db_id = Date.now().toString(); // unique ID
        const docRef = doc(db, DB_COLLECTION, recordData.db_id);
        await setDoc(docRef, recordData);
      }
      
      if (typeof renderDatabase === 'function') renderDatabase();
    } catch (e) {
      console.error("Error saving to database: ", e);
      alert("Failed to save to cloud database. Check console.");
    }
  };

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      editingDbId = null;
      if (btnAddDbText) btnAddDbText.textContent = "Add to Database";
      btnCancelEdit.style.display = "none";
      advanceCertId(); // reset to next new ID
    });
  }

  btnDownloadPdf.addEventListener('click', () => {
    saveToDatabase();
    if (editingDbId === null) advanceCertId();
  });
  
  btnDownloadPng.addEventListener('click', () => {
    saveToDatabase();
    if (editingDbId === null) advanceCertId();
  });
  
  const btnAddDb = document.getElementById('btnAddDb');
  if (btnAddDb) {
    btnAddDb.addEventListener('click', () => {
      saveToDatabase();
      if (editingDbId === null) advanceCertId();
      showCertView(); // Optional: Flip back to preview after adding
    });
  }

  const btnViewDb = document.getElementById('btnViewDb');
  const btnBackToCert = document.getElementById('btnBackToCert');
  const certPreviewView = document.getElementById('certPreviewView');
  const dbListView = document.getElementById('dbListView');

  const showDbView = () => {
    if(certPreviewView) certPreviewView.style.display = 'none';
    if(dbListView) dbListView.style.display = 'block';
  };

  const showCertView = () => {
    if(dbListView) dbListView.style.display = 'none';
    if(certPreviewView) certPreviewView.style.display = 'flex';
    if (typeof adjustPreviewScale === 'function') setTimeout(adjustPreviewScale, 50);
  };

  if(btnViewDb) {
    btnViewDb.addEventListener('click', () => {
      renderDatabase();
      showDbView();
    });
  }

  if(btnBackToCert) {
    btnBackToCert.addEventListener('click', showCertView);
  }

  const dbTableBody = document.getElementById('dbTableBody');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnClearDb = document.getElementById('btnClearDb');

  window.editRecord = async (id) => {
    try {
      const q = query(collection(db, DB_COLLECTION));
      const querySnapshot = await getDocs(q);
      let rec = null;
      querySnapshot.forEach(doc => {
        if (doc.data().db_id === id.toString() || doc.id === id.toString()) rec = doc.data();
      });
      if (!rec) return;
      
      inputName.value = rec.student_name;
      inputStartDate.value = rec.start_date;
      inputEndDate.value = rec.end_date;
      inputDuration.value = rec.total_days;
      inputCertId.value = rec.cert_id;
      
      if (inputCertYear && inputCertNum && rec.cert_id) {
        const parts = rec.cert_id.split('/');
        if (parts.length >= 4) {
          inputCertYear.value = parts[2];
          inputCertNum.value = parts[3];
        }
      }
      
      const optionExists = Array.from(selectCourse.options).some(opt => opt.value === rec.internship_details);
      if (optionExists) {
        selectCourse.value = rec.internship_details;
        inputCourse.style.display = 'none';
        inputCourse.value = '';
      } else {
        selectCourse.value = 'other';
        inputCourse.style.display = 'block';
        inputCourse.value = rec.internship_details;
      }
      
      // Update preview directly
      viewName.textContent = rec.student_name;
      viewCourse.textContent = rec.internship_details;
      const startObj = new Date(rec.start_date);
      const endObj = new Date(rec.end_date);
      const formatOpts = { day: '2-digit', month: 'long', year: 'numeric' };
      if(!isNaN(startObj)) viewStartDate.textContent = startObj.toLocaleDateString('en-GB', formatOpts);
      if(!isNaN(endObj)) viewEndDate.textContent = endObj.toLocaleDateString('en-GB', formatOpts);
      viewDuration.textContent = rec.total_days;
      viewCertId.textContent = rec.cert_id;
      
      editingDbId = id.toString();
      if (btnAddDbText) btnAddDbText.textContent = "Update Record";
      if (btnCancelEdit) btnCancelEdit.style.display = "block";
    } catch(e) { console.error(e); }
  };

  window.deleteRecord = async (id, event) => {
    if(event) event.stopPropagation();
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, DB_COLLECTION, id.toString()));
        renderDatabase();
      } catch (e) { console.error("Error deleting document: ", e); }
    }
  };

  const renderDatabase = async () => {
    if (!dbTableBody) return;
    
    try {
      const q = query(collection(db, DB_COLLECTION), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      dbTableBody.innerHTML = '';
      if (records.length === 0) {
        dbTableBody.innerHTML = '<div style="padding: 20px; text-align: center; color: #a0aec0; font-size: 13px; grid-column: 1/-1;">No certificates generated yet.</div>';
        return;
      }

      if (currentDbView === 'grid') {
        dbTableBody.style.display = 'grid';
        dbTableBody.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        dbTableBody.style.gap = '15px';
        
        records.forEach(rec => {
          const item = document.createElement('div');
          item.className = 'db-item';
          item.style.cursor = 'pointer';
          item.onclick = () => window.viewRecordModal(rec.id);
          item.innerHTML = `
            <div class="db-item-header">
              <span class="db-item-id">${rec.cert_id}</span>
            </div>
            <div class="db-item-name">${rec.student_name}</div>
            <div class="db-item-course" style="font-weight: 500; margin-bottom: 5px;">${rec.internship_details}</div>
            <div class="db-item-details" style="font-size: 11px; color: #718096; margin-bottom: 10px; line-height: 1.4;">
              <div><strong>Start:</strong> ${rec.start_date || 'N/A'}</div>
              <div><strong>End:</strong> ${rec.end_date || 'N/A'}</div>
              <div><strong>Duration:</strong> ${rec.total_days || 'N/A'}</div>
            </div>
            <div class="db-item-actions">
              <button class="btn-edit" onclick="event.stopPropagation(); editRecord('${rec.id}')">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
              </button>
              <button class="btn-delete" onclick="deleteRecord('${rec.id}', event)">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Del
              </button>
            </div>
          `;
          dbTableBody.appendChild(item);
        });
      } else {
        // Table View
        dbTableBody.style.display = 'block';
        let html = `
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: var(--bg-light); border-bottom: 2px solid #e2e8f0; color: var(--primary-navy);">
                <th style="padding: 12px 15px;">Cert ID</th>
                <th style="padding: 12px 15px;">Name</th>
                <th style="padding: 12px 15px;">Course</th>
                <th style="padding: 12px 15px;">Duration</th>
                <th style="padding: 12px 15px;">Actions</th>
              </tr>
            </thead>
            <tbody>
        `;
        records.forEach(rec => {
          html += `
            <tr style="border-bottom: 1px solid #edf2f7; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='#fff'" onclick="window.viewRecordModal('${rec.id}')">
              <td style="padding: 12px 15px; font-weight: 600; color: var(--primary-gold);">${rec.cert_id}</td>
              <td style="padding: 12px 15px; font-weight: 600; color: var(--primary-navy);">${rec.student_name}</td>
              <td style="padding: 12px 15px; color: #4a5568;">${rec.internship_details}</td>
              <td style="padding: 12px 15px; color: #718096;">${rec.total_days}</td>
              <td style="padding: 12px 15px;">
                <button onclick="event.stopPropagation(); editRecord('${rec.id}')" style="background:transparent; border:none; color:var(--primary-navy); cursor:pointer; margin-right:8px;" title="Edit">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onclick="deleteRecord('${rec.id}', event)" style="background:transparent; border:none; color:#e53e3e; cursor:pointer;" title="Delete">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          `;
        });
        html += `</tbody></table>`;
        dbTableBody.innerHTML = html;
      }
    } catch(e) { console.error("Error loading db", e); }
  };

  if(btnClearDb) {
    btnClearDb.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all generated certificates? This cannot be undone.')) {
        try {
          const q = query(collection(db, DB_COLLECTION));
          const querySnapshot = await getDocs(q);
          const deletePromises = [];
          querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, DB_COLLECTION, document.id)));
          });
          await Promise.all(deletePromises);
          renderDatabase();
        } catch(e) { console.error(e); }
      }
    });
  }

  if(btnExportCsv) {
    btnExportCsv.addEventListener('click', async () => {
      try {
        const q = query(collection(db, DB_COLLECTION));
        const querySnapshot = await getDocs(q);
        const records = [];
        querySnapshot.forEach((doc) => records.push({ id: doc.id, ...doc.data() }));

        if (records.length === 0) {
          alert('No records to export!');
          return;
        }
        
        const headers = ['ID', 'Student Name', 'Internship Details', 'Start Date', 'End Date', 'Total Days', 'Cert ID', 'Timestamp'];
        const csvRows = [headers.join(',')];
        
        records.forEach(rec => {
          const values = [
            rec.id, 
            `"${rec.student_name}"`, 
            `"${rec.internship_details}"`, 
            rec.start_date, 
            rec.end_date, 
            rec.total_days, 
            rec.cert_id,
            rec.timestamp
          ];
          csvRows.push(values.join(','));
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'aroxtech_certificates.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch(e) { console.error(e); }
    });
  }

  /* ==========================================================================
     TOGGLE VIEW LOGIC
     ========================================================================== */
  const btnGridView = document.getElementById('btnGridView');
  const btnTableView = document.getElementById('btnTableView');
  
  if (btnGridView && btnTableView) {
    btnGridView.addEventListener('click', () => {
      currentDbView = 'grid';
      btnGridView.style.background = '#fff';
      btnGridView.style.color = 'var(--primary-navy)';
      btnGridView.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      btnTableView.style.background = 'transparent';
      btnTableView.style.color = '#718096';
      btnTableView.style.boxShadow = 'none';
      renderDatabase();
    });
    btnTableView.addEventListener('click', () => {
      currentDbView = 'table';
      btnTableView.style.background = '#fff';
      btnTableView.style.color = 'var(--primary-navy)';
      btnTableView.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      btnGridView.style.background = 'transparent';
      btnGridView.style.color = '#718096';
      btnGridView.style.boxShadow = 'none';
      renderDatabase();
    });
  }

  /* ==========================================================================
     RECORD MODAL LOGIC
     ========================================================================== */
  const recordModal = document.getElementById('recordModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalPreviewContainer = document.getElementById('modalPreviewContainer');
  const exportWrapper = document.getElementById('exportWrapper');
  
  window.viewRecordModal = async (id) => {
    try {
      // Fetch data
      const q = query(collection(db, DB_COLLECTION));
      const querySnapshot = await getDocs(q);
      let rec = null;
      querySnapshot.forEach(doc => {
        if (doc.data().db_id === id.toString() || doc.id === id.toString()) rec = doc.data();
      });
      if (!rec) return;

      // Populate text fields
      document.getElementById('modalCertId').textContent = rec.cert_id;
      document.getElementById('modalName').textContent = rec.student_name;
      document.getElementById('modalCourse').textContent = rec.internship_details;
      document.getElementById('modalDuration').textContent = rec.total_days;
      
      const startObj = new Date(rec.start_date);
      const endObj = new Date(rec.end_date);
      const formatOpts = { day: '2-digit', month: 'long', year: 'numeric' };
      document.getElementById('modalStart').textContent = !isNaN(startObj) ? startObj.toLocaleDateString('en-GB', formatOpts) : rec.start_date;
      document.getElementById('modalEnd').textContent = !isNaN(endObj) ? endObj.toLocaleDateString('en-GB', formatOpts) : rec.end_date;

      // Open Modal
      recordModal.style.display = 'flex';
      modalPreviewContainer.innerHTML = `<div style="color: #a0aec0; display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <svg class="spinner" viewBox="0 0 50 50" style="width: 30px; height: 30px; animation: spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle></svg>
        Generating Preview...
      </div>`;

      // Silently inject this record into the main editor to update the DOM
      await window.editRecord(id);
      
      // Give DOM time to reflow text
      setTimeout(async () => {
        try {
          const canvas = await window.html2canvas(exportWrapper, {
            scale: 1, // smaller scale for fast preview
            useCORS: true,
            logging: false,
            backgroundColor: null
          });
          const imgUrl = canvas.toDataURL('image/png');
          modalPreviewContainer.innerHTML = `<img src="${imgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 4px;">`;
        } catch(e) {
          console.error("Preview Generation Error:", e);
          modalPreviewContainer.innerHTML = `<div style="color:#e53e3e;">Failed to generate preview.</div>`;
        }
      }, 300);

      // Setup Export Buttons
      document.getElementById('modalBtnPdf').onclick = () => btnDownloadPdf.click();
      document.getElementById('modalBtnPng').onclick = () => btnDownloadPng.click();
      document.getElementById('modalBtnPrint').onclick = () => window.print();

    } catch(e) { console.error(e); }
  };

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      recordModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === recordModal) {
      recordModal.style.display = 'none';
    }
  });

  // Initialize Right Panel view
  renderDatabase();

  // Initialize auto ID on page load
  advanceCertId();

});

