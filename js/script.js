/* ==========================================================================
   Certificate Generator Business Logic
   Locks preview, PNG, PDF, and print to one fixed A4 render source.
   ========================================================================== */

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DB_COLLECTION = "aroxtech_certificates";
const NATIVE_WIDTH = 794;
const NATIVE_HEIGHT = 1123;
const CERT_ID_PATTERN = /^AT\/INT\/(20\d{2})\/(\d{4,})$/;
const DEFAULT_DESCRIPTION = "During this internship, he/she was found to be dedicated,\nenthusiastic and hardworking.\nWe wish him/her all the best for future endeavors.";

const escapeHtml = (value = "") => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
}[char]));

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeCertificateId = (value) => normalizeText(value).toUpperCase();
const getCertificateDocId = (certId) => encodeURIComponent(normalizeCertificateId(certId));

const toTitleCase = (str) => normalizeText(str).toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const parseDateValue = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const generateVerificationToken = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const buildVerificationUrl = (rawBase, certId) => {
  const fallback = "https://aroxtech.in/verify.html";
  const raw = String(rawBase || "").trim();
  const base = raw ? raw.split("?")[0] : fallback;
  const safeBase = base.startsWith("http://") || base.startsWith("https://") ? base : `https://${base}`;
  return `${safeBase}?id=${normalizeCertificateId(certId)}`;
};

const safeFilePart = (value, fallback = "certificate") => {
  const clean = normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return clean || fallback;
};

document.addEventListener("DOMContentLoaded", () => {
  const scaleWrapper = document.getElementById("certScaleWrapper");
  const previewPanel = document.querySelector(".preview-panel");
  const exportWrapper = document.getElementById("export-wrapper");

  const inputName = document.getElementById("inputName");
  const viewName = document.getElementById("viewName");
  const selectCourse = document.getElementById("selectCourse");
  const inputCourse = document.getElementById("inputCourse");
  const viewCourse = document.getElementById("viewCourse");
  const inputStartDate = document.getElementById("inputStartDate");
  const viewStartDate = document.getElementById("viewStartDate");
  const inputEndDate = document.getElementById("inputEndDate");
  const viewEndDate = document.getElementById("viewEndDate");
  const inputDuration = document.getElementById("inputDuration");
  const viewDuration = document.getElementById("viewDuration");
  const selectDomain = document.getElementById("selectDomain");
  const inputDomain = document.getElementById("inputDomain");
  const viewDomain = document.getElementById("viewDomain");
  const inputIssueDate = document.getElementById("inputIssueDate");
  const viewIssueDate = document.getElementById("viewIssueDate");
  const inputCertId = document.getElementById("inputCertId");
  const viewCertId = document.getElementById("viewCertId");
  const inputVerifyUrl = document.getElementById("inputVerifyUrl");
  const viewVerifyUrl = document.getElementById("viewVerifyUrl");
  const inputDescription = document.getElementById("inputDescription");
  const viewDescription = document.getElementById("viewDescription");
  const inputCertYear = document.getElementById("inputCertYear");
  const inputCertNum = document.getElementById("inputCertNum");

  const btnGenId = document.getElementById("btnGenId");
  const btnDownloadPdf = document.getElementById("btnDownloadPdf");
  const btnDownloadPng = document.getElementById("btnDownloadPng");
  const btnPrint = document.getElementById("btnPrint");
  const btnAddDb = document.getElementById("btnAddDb");
  const btnAddDbText = document.getElementById("btnAddDbText");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const btnViewDb = document.getElementById("btnViewDb");
  const btnBackToCert = document.getElementById("btnBackToCert");
  const btnExportCsv = document.getElementById("btnExportCsv");
  const btnClearDb = document.getElementById("btnClearDb");
  const btnGridView = document.getElementById("btnGridView");
  const btnTableView = document.getElementById("btnTableView");
  const certPreviewView = document.getElementById("certPreviewView");
  const dbListView = document.getElementById("dbListView");
  const dbTableBody = document.getElementById("dbTableBody");
  const qrcodeContainer = document.getElementById("qrcode");
  const selectTemplate = document.getElementById("selectTemplate");
  const certificate = document.getElementById("certificate");
  const recordModal = document.getElementById("recordModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const modalPreviewContainer = document.getElementById("modalPreviewContainer");

  if (!exportWrapper || !scaleWrapper) {
    console.error("Certificate render root is missing. Export disabled.");
    return;
  }

  let editingDbId = null;
  let currentDbView = "grid";
  let currentVerificationToken = generateVerificationToken();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    if (!months[monthIndex]) return dateStr;
    return `${parts[2].padStart(2, "0")} ${months[monthIndex]} ${parts[0]}`;
  };

  const getSelectedCourse = () => (
    selectCourse.value === "other" ? normalizeText(inputCourse.value) : normalizeText(selectCourse.value)
  );

  const getSelectedDomain = () => (
    selectDomain.value === "other" ? normalizeText(inputDomain.value) : normalizeText(selectDomain.value)
  );

  const updateQRCode = (url) => {
    if (!qrcodeContainer) return;
    qrcodeContainer.innerHTML = "";
    if (!url || url === "[Verification URL]") return;

    const qrUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    new QRCode(qrcodeContainer, {
      text: qrUrl,
      width: 70,
      height: 70,
      colorDark: "#082A66",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  };

  const syncInput = (inputEl, viewEl, placeholderText, transform = (value) => value) => {
    const updateView = () => {
      viewEl.textContent = transform(inputEl.value) || placeholderText;
    };
    inputEl.addEventListener("input", updateView);
    updateView();
  };

  const syncInputName = (inputEl, viewEl, placeholderText) => {
    const updateView = () => {
      viewEl.textContent = toTitleCase(inputEl.value) || placeholderText;
    };
    inputEl.addEventListener("input", updateView);
    updateView();
  };

  const syncDateInput = (inputEl, viewEl, placeholderText) => {
    const updateView = () => {
      viewEl.textContent = formatDate(inputEl.value) || placeholderText;
    };
    inputEl.addEventListener("input", updateView);
    inputEl.addEventListener("change", updateView);
    updateView();
  };

  const updateCertId = () => {
    const year = normalizeText(inputCertYear.value);
    const sequence = normalizeText(inputCertNum.value);
    const certId = normalizeCertificateId(`AT/INT/${year}/${sequence}`);
    inputCertId.value = certId;
    inputCertId.dispatchEvent(new Event("input"));
    inputVerifyUrl.value = buildVerificationUrl(inputVerifyUrl.value, certId, currentVerificationToken);
    inputVerifyUrl.dispatchEvent(new Event("input"));
  };

  const handleCourseChange = () => {
    let courseVal = "";
    if (selectCourse.value === "other") {
      inputCourse.style.display = "block";
      const startPos = inputCourse.selectionStart;
      const endPos = inputCourse.selectionEnd;
      inputCourse.value = inputCourse.value.toUpperCase();
      inputCourse.setSelectionRange(startPos, endPos);
      courseVal = inputCourse.value.trim();
      viewCourse.textContent = courseVal || "[Internship/Course Title]";
    } else {
      inputCourse.style.display = "none";
      inputCourse.value = selectCourse.value || "";
      courseVal = selectCourse.value || "";
      viewCourse.textContent = courseVal || "[Internship/Course Title]";
    }
    
    if (courseVal.includes(" INTERNSHIP")) {
      const derivedDomain = courseVal.replace(" INTERNSHIP", "").trim();
      selectDomain.value = "other";
      inputDomain.style.display = "block";
      inputDomain.value = derivedDomain;
      viewDomain.textContent = derivedDomain || "[Domain]";
    }
  };

  const handleDomainChange = () => {
    if (selectDomain.value === "other") {
      inputDomain.style.display = "block";
      viewDomain.textContent = inputDomain.value.trim() || "[Domain]";
      return;
    }
    inputDomain.style.display = "none";
    inputDomain.value = selectDomain.value || "";
    viewDomain.textContent = selectDomain.value || "[Domain]";
  };

  const syncDescription = () => {
    viewDescription.textContent = inputDescription.value.trim() || DEFAULT_DESCRIPTION;
  };

  const setInputValue = (inputEl, value) => {
    inputEl.value = value || "";
    inputEl.dispatchEvent(new Event("input"));
    inputEl.dispatchEvent(new Event("change"));
  };

  const buildCurrentRecord = () => {
    const certId = normalizeCertificateId(inputCertId.value);
    const token = currentVerificationToken || generateVerificationToken();
    currentVerificationToken = token;
    const verificationUrl = buildVerificationUrl(inputVerifyUrl.value, certId, token);

    return {
      student_name: toTitleCase(inputName.value),
      internship_details: getSelectedCourse(),
      domain: getSelectedDomain(),
      start_date: inputStartDate.value,
      end_date: inputEndDate.value,
      total_days: normalizeText(inputDuration.value).toUpperCase(),
      issue_date: inputIssueDate.value,
      cert_id: certId,
      cert_year: inputCertYear.value.trim(),
      cert_seq: parseInt(inputCertNum.value, 10) || null,
      appreciation_text: inputDescription.value.trim() || DEFAULT_DESCRIPTION,
      organization_name: "Arox Tech",
      verification_token: token,
      verification_url: verificationUrl,
      status: "VALID",
      render_version: "fixed-a4-v2",
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const validateFields = () => {
    const name = normalizeText(inputName.value);
    const course = getSelectedCourse();
    const domain = getSelectedDomain();
    const certId = normalizeCertificateId(inputCertId.value);
    const startDate = parseDateValue(inputStartDate.value);
    const endDate = parseDateValue(inputEndDate.value);
    const issueDate = parseDateValue(inputIssueDate.value);

    if (!name || name.length < 2 || /[<>]/.test(name)) {
      alert("Please enter a valid candidate name.");
      inputName.focus();
      return false;
    }
    if (!course || /[<>]/.test(course)) {
      alert("Please select or enter a valid Internship/Course Title.");
      (selectCourse.value === "other" ? inputCourse : selectCourse).focus();
      return false;
    }
    if (!domain || /[<>]/.test(domain)) {
      alert("Please select or enter a valid Domain.");
      (selectDomain.value === "other" ? inputDomain : selectDomain).focus();
      return false;
    }
    if (!startDate || !endDate || !issueDate) {
      alert("Please enter valid start, end, and issue dates.");
      return false;
    }
    if (endDate < startDate) {
      alert("End Date cannot be earlier than Start Date.");
      inputEndDate.focus();
      return false;
    }
    if (issueDate < endDate) {
      alert("Date of Issue cannot be earlier than the internship End Date.");
      inputIssueDate.focus();
      return false;
    }
    if (!normalizeText(inputDuration.value)) {
      alert("Please enter a valid duration.");
      inputDuration.focus();
      return false;
    }
    if (!CERT_ID_PATTERN.test(certId)) {
      alert("Certificate ID must follow AT/INT/YYYY/0001 format.");
      inputCertNum.focus();
      return false;
    }
    if ((inputDescription.value || DEFAULT_DESCRIPTION).length > 700) {
      alert("Appreciation text is too long for the fixed certificate layout.");
      inputDescription.focus();
      return false;
    }

    try {
      buildVerificationUrl(inputVerifyUrl.value, certId, currentVerificationToken);
    } catch (error) {
      alert("Please enter a valid verification URL.");
      inputVerifyUrl.focus();
      return false;
    }

    return true;
  };

  const calculateDuration = () => {
    const start = parseDateValue(inputStartDate.value);
    const end = parseDateValue(inputEndDate.value);
    if (!start || !end || end < start) return;

    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const duration = `${diffDays} DAYS`;
    inputDuration.value = duration;
    viewDuration.textContent = duration;
  };

  const adjustPreviewScale = () => {
    if (!previewPanel || !scaleWrapper) return;
    const margin = window.innerWidth <= 950 ? 30 : 60;
    const availableWidth = Math.max(previewPanel.clientWidth - margin, 1);
    const availableHeight = Math.max(previewPanel.clientHeight - margin, 1);
    const scaleFactor = Math.min(availableWidth / NATIVE_WIDTH, availableHeight / NATIVE_HEIGHT, 1);

    scaleWrapper.style.transform = `scale(${scaleFactor})`;

    const scroller = scaleWrapper.parentElement;
    if (scroller) {
      scroller.style.width = `${NATIVE_WIDTH * scaleFactor}px`;
      scroller.style.height = `${NATIVE_HEIGHT * scaleFactor}px`;
    }
  };

  const waitForRenderAssets = async (root) => {
    if (document.fonts) await document.fonts.ready;

    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.warn("Certificate asset failed to load:", img.getAttribute("src"));
          resolve();
        };
      });
    }));

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };

  const prepareExportRender = () => {
    const scroller = scaleWrapper.parentElement;
    const exportFooter = document.querySelector(".cert-export-footer");
    const saved = {
      wrapperTransform: scaleWrapper.style.transform,
      wrapperTransformOrigin: scaleWrapper.style.transformOrigin,
      scrollerWidth: scroller ? scroller.style.width : "",
      scrollerHeight: scroller ? scroller.style.height : "",
      exportWidth: exportWrapper.style.width,
      exportHeight: exportWrapper.style.height,
      exportShadow: exportWrapper.style.boxShadow,
      exportOverflow: exportWrapper.style.overflow,
      footerDisplay: exportFooter ? exportFooter.style.display : ""
    };

    if (exportFooter) exportFooter.style.display = "none";
    scaleWrapper.style.position = "fixed";
    scaleWrapper.style.top = "0";
    scaleWrapper.style.left = "0";
    scaleWrapper.style.zIndex = "9999";
    scaleWrapper.style.margin = "0";
    scaleWrapper.style.transform = "none";
    scaleWrapper.style.transformOrigin = "top left";
    exportWrapper.style.width = `${NATIVE_WIDTH}px`;
    exportWrapper.style.height = `${NATIVE_HEIGHT}px`;
    exportWrapper.style.overflow = "hidden";
    exportWrapper.style.boxShadow = "none";
    if (scroller) {
      scroller.style.width = `${NATIVE_WIDTH}px`;
      scroller.style.height = `${NATIVE_HEIGHT}px`;
    }

    const ribbon = exportWrapper.querySelector('.cert-banner-wrapper');
    let savedRibbon = {};
    if (ribbon) {
      savedRibbon = {
        height: ribbon.style.height,
        paddingTop: ribbon.style.paddingTop,
        paddingBottom: ribbon.style.paddingBottom
      };
      ribbon.style.height = '70px';
    }

    return () => {
      scaleWrapper.style.position = "";
      scaleWrapper.style.top = "";
      scaleWrapper.style.left = "";
      scaleWrapper.style.zIndex = "";
      scaleWrapper.style.margin = "";
      scaleWrapper.style.transformOrigin = saved.wrapperTransformOrigin;
      scaleWrapper.style.transform = saved.wrapperTransform;
      exportWrapper.style.width = saved.exportWidth;
      exportWrapper.style.height = saved.exportHeight;
      exportWrapper.style.overflow = saved.exportOverflow;
      exportWrapper.style.boxShadow = saved.exportShadow;
      if (scroller) {
        scroller.style.width = saved.scrollerWidth;
        scroller.style.height = saved.scrollerHeight;
      }
      if (ribbon) {
        ribbon.style.height = savedRibbon.height;
        ribbon.style.paddingTop = savedRibbon.paddingTop;
        ribbon.style.paddingBottom = savedRibbon.paddingBottom;
      }
      if (exportFooter) exportFooter.style.display = saved.footerDisplay || "flex";
      adjustPreviewScale();
    };
  };

  const renderCertificateCanvas = async ({ scale = 3 } = {}) => {
    if (!window.html2canvas) throw new Error("html2canvas library is not loaded.");
    const restore = prepareExportRender();
    try {
      await waitForRenderAssets(exportWrapper);
      return await html2canvas(exportWrapper, {
        scale,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        letterRendering: true,
        allowTaint: false,
        imageTimeout: 15000,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: true
      });
    } finally {
      restore();
    }
  };

  const saveCanvasAsPng = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas toBlob returned null."));
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeFilePart(inputName.value)}_internship_certificate.png`;
      link.href = blobUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      resolve();
    }, "image/png", 1.0);
  });

  const saveCanvasAsPdf = (canvas) => {
    if (!window.jspdf?.jsPDF) throw new Error("jsPDF library is not loaded.");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
    pdf.save(`${safeFilePart(inputName.value)}_internship_certificate.pdf`);
  };

  const printCanvas = (canvas) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const docRef = iframe.contentDocument || iframe.contentWindow.document;
    docRef.open();
    docRef.write(`<!doctype html>
      <html>
        <head>
          <title>Print Certificate</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0; width: 210mm; height: 297mm; overflow: hidden; background: #fff; }
            img { display: block; width: 210mm; height: 297mm; object-fit: fill; }
          </style>
        </head>
        <body><img alt="Certificate" src="${canvas.toDataURL("image/png")}"></body>
      </html>`);
    docRef.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 250);
  };

  const verifyNoDuplicate = async (record, targetDocId) => {
    const direct = await getDoc(doc(db, DB_COLLECTION, getCertificateDocId(record.cert_id)));
    if (direct.exists() && direct.id !== targetDocId) return false;

    const duplicateQuery = query(
      collection(db, DB_COLLECTION),
      where("cert_id", "==", record.cert_id),
      limit(2)
    );
    const snapshot = await getDocs(duplicateQuery);
    let duplicate = false;
    snapshot.forEach((documentSnapshot) => {
      if (documentSnapshot.id !== targetDocId) duplicate = true;
    });
    return !duplicate;
  };

  const saveToDatabase = async ({ requireValid = true, showSuccess = false } = {}) => {
    if (requireValid && !validateFields()) return { ok: false, wasEditing: editingDbId !== null };

    const wasEditing = editingDbId !== null;
    const recordData = buildCurrentRecord();
    const targetDocId = editingDbId || getCertificateDocId(recordData.cert_id);

    try {
      const isUnique = await verifyNoDuplicate(recordData, targetDocId);
      if (!isUnique) {
        alert("A certificate with this ID already exists. Use a unique Certificate ID.");
        return { ok: false, wasEditing };
      }

      recordData.db_id = targetDocId;
      recordData.verification_url = buildVerificationUrl(inputVerifyUrl.value, recordData.cert_id, recordData.verification_token);
      if (!wasEditing) recordData.createdAt = new Date().toISOString();
      inputVerifyUrl.value = recordData.verification_url;
      inputVerifyUrl.dispatchEvent(new Event("input"));

      await setDoc(doc(db, DB_COLLECTION, targetDocId), recordData, { merge: wasEditing });

      if (wasEditing) {
        editingDbId = null;
        if (btnAddDbText) btnAddDbText.textContent = "Add to Database";
        if (btnCancelEdit) btnCancelEdit.style.display = "none";
      }

      if (showSuccess) alert("Certificate saved successfully.");
      await renderDatabase();
      return { ok: true, wasEditing };
    } catch (error) {
      console.error("Error saving certificate:", error);
      alert("Failed to save certificate. Check your network connection and Firebase permissions.");
      return { ok: false, wasEditing };
    }
  };

  const runExport = async (type) => {
    if (!validateFields()) return;

    const button = type === "pdf" ? btnDownloadPdf : type === "png" ? btnDownloadPng : btnPrint;
    const originalTitle = button?.getAttribute("title") || "";
    if (button) {
      button.disabled = true;
      button.setAttribute("title", "Rendering certificate...");
    }

    try {
      const saveResult = await saveToDatabase({ requireValid: false });
      if (!saveResult.ok) return;

      const canvas = await renderCertificateCanvas({ scale: 3.1234257 });
      if (type === "png") await saveCanvasAsPng(canvas);
      if (type === "pdf") saveCanvasAsPdf(canvas);
      if (type === "print") printCanvas(canvas);
    } catch (error) {
      console.error(`${type.toUpperCase()} export failed:`, error);
      alert(`${type.toUpperCase()} export failed. Check the console for details.`);
    } finally {
      if (button) {
        button.disabled = false;
        button.setAttribute("title", originalTitle);
      }
    }
  };

  const getRecordById = async (id) => {
    const snapshot = await getDoc(doc(db, DB_COLLECTION, id.toString()));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  };

  const populateEditorFromRecord = (record) => {
    inputName.value = toTitleCase(record.student_name || "");
    inputName.dispatchEvent(new Event("input"));
    setInputValue(inputStartDate, toDateInputValue(record.start_date));
    setInputValue(inputEndDate, toDateInputValue(record.end_date));
    setInputValue(inputDuration, record.total_days || "");
    setInputValue(inputIssueDate, toDateInputValue(record.issue_date || record.timestamp || record.createdAt));

    const certId = normalizeCertificateId(record.cert_id || "");
    inputCertId.value = certId;
    inputCertId.dispatchEvent(new Event("input"));
    const parts = certId.split("/");
    if (parts.length >= 4) {
      inputCertYear.value = parts[2];
      inputCertNum.value = parts[3];
    }

    const course = record.internship_details || "";
    const courseOptionExists = Array.from(selectCourse.options).some((option) => option.value === course);
    selectCourse.value = courseOptionExists ? course : "other";
    inputCourse.value = courseOptionExists ? "" : course.toUpperCase();
    handleCourseChange();

    const domain = record.domain || "";
    const domainOptionExists = Array.from(selectDomain.options).some((option) => option.value === domain);
    selectDomain.value = domainOptionExists ? domain : "other";
    inputDomain.value = domainOptionExists ? "" : domain;
    handleDomainChange();

    inputVerifyUrl.value = record.verification_url || buildVerificationUrl("aroxtech.in/verify.html", certId);
    inputVerifyUrl.dispatchEvent(new Event("input"));

    inputDescription.value = record.appreciation_text || DEFAULT_DESCRIPTION;
    syncDescription();
  };

  const advanceCertId = async ({ rotateToken = true } = {}) => {
    const year = normalizeText(inputCertYear.value) || String(new Date().getFullYear());
    let nextNum = 101;

    try {
      const snapshot = await getDocs(query(collection(db, DB_COLLECTION)));
      snapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data();
        const certId = normalizeCertificateId(data.cert_id || "");
        const match = certId.match(CERT_ID_PATTERN);
        if (!match || match[1] !== year) return;
        const sequence = parseInt(match[2], 10);
        if (!Number.isNaN(sequence) && sequence >= nextNum) nextNum = sequence + 1;
      });
    } catch (error) {
      console.warn("Could not read existing certificate IDs. Falling back to 0101.", error);
    }

    inputCertYear.value = year;
    inputCertNum.value = String(nextNum).padStart(4, "0");
    updateCertId();
  };

  const showDbView = () => {
    if (certPreviewView) certPreviewView.style.display = "none";
    if (dbListView) dbListView.style.display = "block";
  };

  const showCertView = () => {
    if (dbListView) dbListView.style.display = "none";
    if (certPreviewView) certPreviewView.style.display = "flex";
    setTimeout(adjustPreviewScale, 50);
  };

  window.editRecord = async (id) => {
    try {
      const record = await getRecordById(id);
      if (!record) {
        alert("Certificate record not found.");
        return;
      }

      populateEditorFromRecord(record);
      editingDbId = id.toString();
      if (btnAddDbText) btnAddDbText.textContent = "Update Record";
      if (btnCancelEdit) btnCancelEdit.style.display = "block";
      showCertView();
    } catch (error) {
      console.error("Error loading certificate for edit:", error);
      alert("Failed to load certificate record.");
    }
  };

  window.deleteRecord = async (id, event) => {
    if (event) event.stopPropagation();
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, DB_COLLECTION, id.toString()));
      await renderDatabase();
    } catch (error) {
      console.error("Error deleting certificate:", error);
      alert("Failed to delete certificate.");
    }
  };

  window.viewRecordModal = async (id) => {
    if (!recordModal || !modalPreviewContainer) return;

    try {
      const record = await getRecordById(id);
      if (!record) {
        alert("Certificate record not found.");
        return;
      }

      document.getElementById("modalCertId").textContent = record.cert_id || "-";
      document.getElementById("modalName").textContent = record.student_name || "-";
      document.getElementById("modalCourse").textContent = record.internship_details || "-";
      document.getElementById("modalDuration").textContent = record.total_days || "-";
      document.getElementById("modalStart").textContent = formatDate(toDateInputValue(record.start_date)) || "-";
      document.getElementById("modalEnd").textContent = formatDate(toDateInputValue(record.end_date)) || "-";

      recordModal.style.display = "flex";
      modalPreviewContainer.innerHTML = '<div style="color:#a0aec0;display:flex;flex-direction:column;align-items:center;gap:10px;">Generating Preview...</div>';

      populateEditorFromRecord(record);
      editingDbId = id.toString();
      const canvas = await renderCertificateCanvas({ scale: 0.8 });
      const imgUrl = canvas.toDataURL("image/png");
      modalPreviewContainer.innerHTML = `<img src="${imgUrl}" alt="Certificate preview" style="max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 4px 6px rgba(0,0,0,0.1);border-radius:4px;">`;

      const modalBtnPdf = document.getElementById("modalBtnPdf");
      const modalBtnPng = document.getElementById("modalBtnPng");
      const modalBtnPrint = document.getElementById("modalBtnPrint");
      if (modalBtnPdf) modalBtnPdf.onclick = () => runExport("pdf");
      if (modalBtnPng) modalBtnPng.onclick = () => runExport("png");
      if (modalBtnPrint) modalBtnPrint.onclick = () => runExport("print");
    } catch (error) {
      console.error("Preview Generation Error:", error);
      modalPreviewContainer.innerHTML = '<div style="color:#e53e3e;">Failed to generate preview.</div>';
    }
  };

  const renderEmptyDatabaseState = (message) => {
    if (!dbTableBody) return;
    dbTableBody.innerHTML = `<div style="padding:20px;text-align:center;color:#a0aec0;font-size:13px;grid-column:1/-1;">${escapeHtml(message)}</div>`;
  };

  async function renderDatabase() {
    if (!dbTableBody) return;

    try {
      const snapshot = await getDocs(query(collection(db, DB_COLLECTION), orderBy("timestamp", "desc")));
      const records = [];
      snapshot.forEach((documentSnapshot) => records.push({ id: documentSnapshot.id, ...documentSnapshot.data() }));

      dbTableBody.innerHTML = "";
      if (records.length === 0) {
        renderEmptyDatabaseState("No certificates generated yet.");
        return;
      }

      if (currentDbView === "grid") {
        dbTableBody.style.display = "grid";
        dbTableBody.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
        dbTableBody.style.gap = "15px";

        records.forEach((record) => {
          const item = document.createElement("div");
          item.className = "db-item";
          item.style.cursor = "pointer";
          item.innerHTML = `
            <div class="db-item-header"><span class="db-item-id">${escapeHtml(record.cert_id || "N/A")}</span></div>
            <div class="db-item-name">${escapeHtml(record.student_name || "N/A")}</div>
            <div class="db-item-course" style="font-weight:500;margin-bottom:5px;">${escapeHtml(record.internship_details || "N/A")}</div>
            <div class="db-item-details" style="font-size:11px;color:#718096;margin-bottom:10px;line-height:1.4;">
              <div><strong>Start:</strong> ${escapeHtml(record.start_date || "N/A")}</div>
              <div><strong>End:</strong> ${escapeHtml(record.end_date || "N/A")}</div>
              <div><strong>Duration:</strong> ${escapeHtml(record.total_days || "N/A")}</div>
            </div>
            <div class="db-item-actions">
              <button class="btn-edit" type="button">Edit</button>
              <button class="btn-delete" type="button">Del</button>
            </div>`;
          item.addEventListener("click", () => window.viewRecordModal(record.id));
          item.querySelector(".btn-edit").addEventListener("click", (event) => {
            event.stopPropagation();
            window.editRecord(record.id);
          });
          item.querySelector(".btn-delete").addEventListener("click", (event) => window.deleteRecord(record.id, event));
          dbTableBody.appendChild(item);
        });
        return;
      }

      dbTableBody.style.display = "block";
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse;font-size:13px;text-align:left;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden;";
      table.innerHTML = `
        <thead>
          <tr style="background:var(--bg-light);border-bottom:2px solid #e2e8f0;color:var(--primary-navy);">
            <th style="padding:12px 15px;">Cert ID</th>
            <th style="padding:12px 15px;">Name</th>
            <th style="padding:12px 15px;">Course</th>
            <th style="padding:12px 15px;">Duration</th>
            <th style="padding:12px 15px;">Actions</th>
          </tr>
        </thead>
        <tbody></tbody>`;
      const tbody = table.querySelector("tbody");
      records.forEach((record) => {
        const row = document.createElement("tr");
        row.style.cssText = "border-bottom:1px solid #edf2f7;cursor:pointer;transition:background 0.2s;";
        row.innerHTML = `
          <td style="padding:12px 15px;font-weight:600;color:var(--primary-gold);">${escapeHtml(record.cert_id || "N/A")}</td>
          <td style="padding:12px 15px;font-weight:600;color:var(--primary-navy);">${escapeHtml(record.student_name || "N/A")}</td>
          <td style="padding:12px 15px;color:#4a5568;">${escapeHtml(record.internship_details || "N/A")}</td>
          <td style="padding:12px 15px;color:#718096;">${escapeHtml(record.total_days || "N/A")}</td>
          <td style="padding:12px 15px;">
            <button class="btn-edit" type="button">Edit</button>
            <button class="btn-delete" type="button">Del</button>
          </td>`;
        row.addEventListener("click", () => window.viewRecordModal(record.id));
        row.querySelector(".btn-edit").addEventListener("click", (event) => {
          event.stopPropagation();
          window.editRecord(record.id);
        });
        row.querySelector(".btn-delete").addEventListener("click", (event) => window.deleteRecord(record.id, event));
        tbody.appendChild(row);
      });
      dbTableBody.innerHTML = "";
      dbTableBody.appendChild(table);
    } catch (error) {
      console.error("Error loading database:", error);
      renderEmptyDatabaseState("Could not load certificates. Check Firebase/network status.");
    }
  }

  const exportCsv = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, DB_COLLECTION)));
      const records = [];
      snapshot.forEach((documentSnapshot) => records.push({ id: documentSnapshot.id, ...documentSnapshot.data() }));
      if (records.length === 0) {
        alert("No records to export.");
        return;
      }

      const headers = ["ID", "Student Name", "Internship Details", "Domain", "Start Date", "End Date", "Issue Date", "Total Days", "Cert ID", "Status", "Timestamp"];
      const csvRows = [headers.join(",")];
      records.forEach((record) => {
        const values = [
          record.id,
          record.student_name,
          record.internship_details,
          record.domain,
          record.start_date,
          record.end_date,
          record.issue_date,
          record.total_days,
          record.cert_id,
          record.status || "VALID",
          record.timestamp || record.createdAt || ""
        ].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`);
        csvRows.push(values.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "aroxtech_certificates.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("CSV export failed.");
    }
  };

  syncInputName(inputName, viewName, "[Recipient Name]");
  syncInput(inputCourse, viewCourse, "[Internship/Course Title]");
  syncDateInput(inputStartDate, viewStartDate, "[Start Date]");
  syncDateInput(inputEndDate, viewEndDate, "[End Date]");
  syncInput(inputDuration, viewDuration, "[Duration]", (value) => value.toUpperCase());
  syncInput(inputDomain, viewDomain, "[Domain]");
  syncDateInput(inputIssueDate, viewIssueDate, "[Date of Issue]");
  syncInput(inputCertId, viewCertId, "[Certificate ID]", normalizeCertificateId);

  inputVerifyUrl.addEventListener("input", () => {
    const url = inputVerifyUrl.value.trim();
    viewVerifyUrl.textContent = url || "[Verification URL]";
    updateQRCode(url);
  });

  inputCertYear.addEventListener("input", updateCertId);
  inputCertNum.addEventListener("input", updateCertId);
  selectCourse.addEventListener("change", handleCourseChange);
  selectDomain.addEventListener("change", handleDomainChange);
  inputDescription.addEventListener("input", syncDescription);
  inputStartDate.addEventListener("change", calculateDuration);
  inputEndDate.addEventListener("change", calculateDuration);
  window.addEventListener("resize", adjustPreviewScale);

  if (selectTemplate && certificate) {
    selectTemplate.addEventListener("change", () => {
      certificate.classList.remove("template-classic", "template-minimalist", "template-geometric", "template-elegant", "template-circuit");
      certificate.classList.add(`template-${selectTemplate.value}`);
    });
    certificate.classList.add(`template-${selectTemplate.value}`);
  }

  if (btnGenId) btnGenId.addEventListener("click", () => advanceCertId({ rotateToken: true }));
  if (btnDownloadPng) btnDownloadPng.addEventListener("click", () => runExport("png"));
  if (btnDownloadPdf) btnDownloadPdf.addEventListener("click", () => runExport("pdf"));
  if (btnPrint) btnPrint.addEventListener("click", () => runExport("print"));

  if (btnAddDb) {
    btnAddDb.addEventListener("click", async () => {
      const result = await saveToDatabase({ showSuccess: true });
      if (!result.ok) return;
      if (!result.wasEditing) await advanceCertId({ rotateToken: true });
      showCertView();
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", async () => {
      editingDbId = null;
      if (btnAddDbText) btnAddDbText.textContent = "Add to Database";
      btnCancelEdit.style.display = "none";
      currentVerificationToken = generateVerificationToken();
      await advanceCertId({ rotateToken: false });
    });
  }

  if (btnViewDb) btnViewDb.addEventListener("click", async () => {
    await renderDatabase();
    showDbView();
  });
  if (btnBackToCert) btnBackToCert.addEventListener("click", showCertView);

  if (btnGridView && btnTableView) {
    btnGridView.addEventListener("click", () => {
      currentDbView = "grid";
      btnGridView.style.background = "#fff";
      btnGridView.style.color = "var(--primary-navy)";
      btnGridView.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      btnTableView.style.background = "transparent";
      btnTableView.style.color = "#718096";
      btnTableView.style.boxShadow = "none";
      renderDatabase();
    });

    btnTableView.addEventListener("click", () => {
      currentDbView = "table";
      btnTableView.style.background = "#fff";
      btnTableView.style.color = "var(--primary-navy)";
      btnTableView.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      btnGridView.style.background = "transparent";
      btnGridView.style.color = "#718096";
      btnGridView.style.boxShadow = "none";
      renderDatabase();
    });
  }

  if (btnClearDb) {
    btnClearDb.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to clear all generated certificates? This cannot be undone.")) return;
      try {
        const snapshot = await getDocs(query(collection(db, DB_COLLECTION)));
        const deletes = [];
        snapshot.forEach((documentSnapshot) => deletes.push(deleteDoc(doc(db, DB_COLLECTION, documentSnapshot.id))));
        await Promise.all(deletes);
        await renderDatabase();
      } catch (error) {
        console.error("Clear database failed:", error);
        alert("Failed to clear database.");
      }
    });
  }

  if (btnExportCsv) btnExportCsv.addEventListener("click", exportCsv);

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      recordModal.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === recordModal) recordModal.style.display = "none";
  });

  handleCourseChange();
  handleDomainChange();
  syncDescription();
  adjustPreviewScale();
  setTimeout(adjustPreviewScale, 100);
  renderDatabase();
  advanceCertId({ rotateToken: false });
});
