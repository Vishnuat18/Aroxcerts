/* ==========================================================================
   Certificate Generator Business Logic
   Implements live bindings, custom inputs, native date formatting,
   form validation alerts, scale previewing, and PDF/PNG exports.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     AUTHENTICATION LOGIC
     ========================================================================== */
  const loginModal = document.getElementById('loginModal');
  const loginPassword = document.getElementById('loginPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const loginError = document.getElementById('loginError');
  const profileIcon = document.getElementById('profileIcon');

  const checkAuth = () => {
    if (sessionStorage.getItem('arox_admin_auth') === 'true') {
      if(loginModal) loginModal.classList.remove('active');
      if(profileIcon) profileIcon.style.display = 'flex';
    } else {
      if(loginModal) loginModal.classList.add('active');
      if(profileIcon) profileIcon.style.display = 'none';
    }
  };

  const attemptLogin = () => {
    if (loginPassword.value === 'arox2026') {
      sessionStorage.setItem('arox_admin_auth', 'true');
      if(loginError) loginError.textContent = '';
      checkAuth();
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

  const inputLogo = document.getElementById('inputLogo');
  const certLogo = document.getElementById('certLogo');

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

  // Prefill defaults if empty or not set on load (prevents browser session state caching)
  if (!inputName.value) inputName.value = "Vishnu R";
  if (!selectCourse.value) selectCourse.value = "WEB DEVELOPMENT INTERNSHIP";
  if (!inputCourse.value) inputCourse.value = "WEB DEVELOPMENT INTERNSHIP";
  if (!inputStartDate.value) inputStartDate.value = "2026-06-08";
  if (!inputEndDate.value) inputEndDate.value = "2026-06-18";
  if (!inputDuration.value) inputDuration.value = "10 DAYS";
  if (!selectDomain.value) selectDomain.value = "WEB DEVELOPMENT";
  if (!inputDomain.value) inputDomain.value = "WEB DEVELOPMENT";
  if (!inputIssueDate.value) inputIssueDate.value = "2026-06-20";
  if (!inputCertId.value) inputCertId.value = "AT/INT/2026/0101";
  if (!inputVerifyUrl.value) inputVerifyUrl.value = "aroxtech.com/veify";

  // Bind individual inputs to their preview segments with placeholders
  syncInput(inputName, viewName, '[Candidate Name]');
  syncInput(inputCourse, viewCourse, '[Internship/Course Title]');
  syncDateInput(inputStartDate, viewStartDate, '[Start Date]');
  syncDateInput(inputEndDate, viewEndDate, '[End Date]');
  syncInput(inputDuration, viewDuration, '[Duration]');
  syncInput(inputDomain, viewDomain, '[Domain]');
  syncDateInput(inputIssueDate, viewIssueDate, '[Date of Issue]');
  syncInput(inputCertId, viewCertId, '[Certificate ID]');

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

  // --- Company Logo Upload Handler ---
  inputLogo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        certLogo.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

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
    const year = 2026;
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
    
    const autoId = `${prefix}${String(nextNum).padStart(4, '0')}`;
    inputCertId.value = autoId;
    viewCertId.textContent = autoId;
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
  });

  window.addEventListener('afterprint', () => {
    // Restore normal preview scaling
    scaleWrapper.style.transformOrigin = 'top center';
    adjustPreviewScale();
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
     LOCAL STORAGE DATABASE
     ========================================================================== */
  const DB_KEY = 'aroxtech_certificates';

  const saveToDatabase = () => {
    if (!inputName.value.trim() || !inputCertId.value.trim()) {
      return; // Need basics to save
    }

    const records = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const existingIndex = records.findIndex(r => r.cert_id === inputCertId.value.trim());
    
    const newRecord = {
      db_id: existingIndex >= 0 ? records[existingIndex].db_id : records.length + 1,
      student_name: inputName.value.trim(),
      internship_details: inputCourse.value.trim() || selectCourse.value,
      start_date: inputStartDate.value,
      end_date: inputEndDate.value,
      total_days: inputDuration.value.trim(),
      cert_id: inputCertId.value.trim(),
      timestamp: new Date().toISOString()
    };
    
    if (existingIndex >= 0 && newRecord.cert_id !== '') {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }
    localStorage.setItem(DB_KEY, JSON.stringify(records));
    if (typeof renderDatabase === 'function') renderDatabase();
  };

  btnDownloadPdf.addEventListener('click', () => {
    saveToDatabase();
    advanceCertId(); // Auto advance after downloading PDF
  });
  
  btnDownloadPng.addEventListener('click', () => {
    saveToDatabase();
    advanceCertId(); // Auto advance after downloading PNG
  });
  
  const btnAddDb = document.getElementById('btnAddDb');
  if (btnAddDb) {
    btnAddDb.addEventListener('click', () => {
      saveToDatabase();
      advanceCertId(); // Auto advance after adding to DB
      alert("Saved to Database successfully!");
    });
  }

  const btnViewDb = document.getElementById('btnViewDb');
  const btnCloseDb = document.getElementById('btnCloseDb');
  const dbModal = document.getElementById('dbModal');
  const dbTableBody = document.getElementById('dbTableBody');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnClearDb = document.getElementById('btnClearDb');

  const renderDatabase = () => {
    const records = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    dbTableBody.innerHTML = '';
    records.forEach(rec => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rec.db_id}</td>
        <td>${rec.student_name}</td>
        <td>${rec.internship_details}</td>
        <td>${rec.start_date}</td>
        <td>${rec.end_date}</td>
        <td>${rec.total_days}</td>
        <td>${rec.cert_id}</td>
      `;
      dbTableBody.appendChild(tr);
    });
  };

  if(btnViewDb) {
    btnViewDb.addEventListener('click', () => {
      renderDatabase();
      dbModal.classList.add('active');
    });
  }

  if(btnCloseDb) {
    btnCloseDb.addEventListener('click', () => {
      dbModal.classList.remove('active');
    });
  }

  if(btnClearDb) {
    btnClearDb.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all generated certificates? This cannot be undone.')) {
        localStorage.removeItem(DB_KEY);
        renderDatabase();
      }
    });
  }

  if(btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const records = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      if (records.length === 0) {
        alert('No records to export!');
        return;
      }
      
      const headers = ['ID', 'Student Name', 'Internship Details', 'Start Date', 'End Date', 'Total Days', 'Cert ID', 'Timestamp'];
      const csvRows = [headers.join(',')];
      
      records.forEach(rec => {
        const values = [
          rec.db_id, 
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
    });
  }

  // Initialize auto ID on page load
  advanceCertId();

});
