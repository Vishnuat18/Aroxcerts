import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DB_COLLECTION = "aroxtech_certificates";

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeCertificateId = (value) => normalizeText(value).toUpperCase();

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    return `${day} ${months[Number(month) - 1] || month} ${year}`;
  }
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
};

const asHttpsUrl = (value) => {
  const url = normalizeText(value);
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
};

document.addEventListener("DOMContentLoaded", () => {
  const certIdInput = document.getElementById("certIdInput");
  const btnVerifyNow = document.getElementById("btnVerifyNow");
  const btnScanQr = document.getElementById("btnScanQr");
  const btnTryAgain = document.getElementById("btnTryAgain");
  const btnVerifyAnother = document.getElementById("btnVerifyAnother");
  const btnViewDetails = document.getElementById("btnViewDetails");
  const btnViewCert = document.getElementById("btnViewCert");

  const vdCertId = document.getElementById("vdCertId");
  const vdName = document.getElementById("vdName");
  const vdProgram = document.getElementById("vdProgram");
  const vdDomain = document.getElementById("vdDomain");
  const vdDuration = document.getElementById("vdDuration");
  const vdIssueDate = document.getElementById("vdIssueDate");
  const tlIssueDate = document.getElementById("tlIssueDate");

  const viewName = document.getElementById("viewName");
  const viewCourse = document.getElementById("viewCourse");
  const viewDomain = document.getElementById("viewDomain");
  const viewStartDate = document.getElementById("viewStartDate");
  const viewEndDate = document.getElementById("viewEndDate");
  const viewDuration = document.getElementById("viewDuration");
  const viewIssueDate = document.getElementById("viewIssueDate");
  const viewCertId = document.getElementById("viewCertId");
  const viewVerifyUrl = document.getElementById("viewVerifyUrl");
  const viewDescription = document.getElementById("viewDescription");
  const qrcodeContainer = document.getElementById("qrcode");

  const steps = [1, 2, 3, 4, 5, 8]
    .map((step) => document.getElementById(`step${step}`))
    .filter(Boolean);

  const invalidText = document.querySelector("#step8 .status-subtext");

  const activateStep = (stepNum) => {
    steps.forEach((step) => {
      step.classList.add("inactive");
      step.classList.remove("active");
    });
    const target = document.getElementById(`step${stepNum}`);
    if (target) {
      target.classList.remove("inactive");
      target.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetWorkflow = () => {
    if (certIdInput) certIdInput.value = "";
    activateStep(1);
  };

  const showInvalid = (message) => {
    if (invalidText) invalidText.textContent = message;
    activateStep(8);
  };

  const renderQRCode = (url) => {
    if (!qrcodeContainer) return;
    qrcodeContainer.innerHTML = "";
    const qrUrl = asHttpsUrl(url);
    if (!qrUrl) return;
    new QRCode(qrcodeContainer, {
      text: qrUrl,
      width: 70,
      height: 70,
      colorDark: "#082A66",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  };

  const findCertificate = async (certId) => {
    const lookup = query(
      collection(db, DB_COLLECTION),
      where("cert_id", "==", certId),
      limit(1)
    );
    const snapshot = await getDocs(lookup);
    let found = null;
    snapshot.forEach((documentSnapshot) => {
      found = { id: documentSnapshot.id, ...documentSnapshot.data() };
    });
    return found;
  };

  const populateCertificate = (record, certId, tokenFromUrl) => {
    if (record.status === "REVOKED") {
      showInvalid("This certificate has been revoked by Arox Tech.");
      return false;
    }

    if (record.verification_token && tokenFromUrl && record.verification_token !== tokenFromUrl) {
      showInvalid("The verification QR token is invalid or has been modified.");
      return false;
    }

    const certIdText = record.cert_id || certId;
    const verifyUrl = record.verification_url || `https://aroxtech.in/verify.html?id=${encodeURIComponent(certIdText)}`;
    const issueDate = formatDate(record.issue_date || record.timestamp || record.createdAt);
    const description = record.appreciation_text || "During this internship, he/she was found to be dedicated, enthusiastic and hardworking. We wish him/her all the best for future endeavors.";

    if (vdCertId) vdCertId.textContent = certIdText;
    if (vdName) vdName.textContent = record.student_name || "--";
    if (vdProgram) vdProgram.textContent = record.internship_details || "--";
    if (vdDomain) vdDomain.textContent = record.domain || "--";
    if (vdDuration) vdDuration.textContent = record.total_days || "--";
    if (vdIssueDate) vdIssueDate.textContent = issueDate;
    if (tlIssueDate) tlIssueDate.textContent = issueDate;

    if (viewName) viewName.textContent = record.student_name || "--";
    if (viewCourse) viewCourse.textContent = record.internship_details || "--";
    if (viewDomain) viewDomain.textContent = record.domain || "--";
    if (viewStartDate) viewStartDate.textContent = formatDate(record.start_date);
    if (viewEndDate) viewEndDate.textContent = formatDate(record.end_date);
    if (viewDuration) viewDuration.textContent = record.total_days || "--";
    if (viewIssueDate) viewIssueDate.textContent = issueDate;
    if (viewCertId) viewCertId.textContent = certIdText;
    if (viewVerifyUrl) viewVerifyUrl.textContent = verifyUrl;
    if (viewDescription) viewDescription.textContent = description;

    renderQRCode(verifyUrl);
    return true;
  };

  const verifyCertificate = async () => {
    const certId = normalizeCertificateId(certIdInput?.value);
    const tokenFromUrl = new URLSearchParams(window.location.search).get("token") || "";

    if (!certId) {
      alert("Please enter a Certificate ID.");
      return;
    }

    if (btnVerifyNow) btnVerifyNow.disabled = true;
    activateStep(2);

    try {
      const record = await findCertificate(certId);
      if (!record) {
        showInvalid("This certificate is not found in our records.");
        return;
      }

      const isValid = populateCertificate(record, certId, tokenFromUrl);
      if (!isValid) return;

      updateDoc(doc(db, DB_COLLECTION, record.id), {
        verifiedCount: increment(1),
        lastVerifiedAt: new Date().toISOString()
      }).catch((error) => console.warn("Could not update verification count:", error));

      activateStep(3);
    } catch (error) {
      console.error("Verification Error:", error);
      showInvalid("Verification failed because the database could not be reached.");
    } finally {
      if (btnVerifyNow) btnVerifyNow.disabled = false;
    }
  };

  if (btnViewDetails) btnViewDetails.addEventListener("click", () => activateStep(4));
  if (btnViewCert) btnViewCert.addEventListener("click", () => activateStep(5));
  if (btnVerifyNow) btnVerifyNow.addEventListener("click", verifyCertificate);
  if (certIdInput) {
    certIdInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") verifyCertificate();
    });
  }
  if (btnTryAgain) btnTryAgain.addEventListener("click", resetWorkflow);
  if (btnVerifyAnother) btnVerifyAnother.addEventListener("click", resetWorkflow);
  if (btnScanQr) {
    btnScanQr.addEventListener("click", () => {
      alert("Open the QR code with your device camera. It will bring you back to this verification page automatically.");
    });
  }

  document.querySelectorAll(".btn-back").forEach((button) => {
    button.addEventListener("click", () => {
      const targetStep = parseInt(button.getAttribute("data-back-to"), 10);
      if (targetStep) activateStep(targetStep);
    });
  });

  window.openCertModal = () => {
    const modal = document.getElementById("certModal");
    const certWrapper = document.getElementById("certTransformWrapper");
    const modalContainer = modal?.querySelector("div");
    if (!modal || !modalContainer || !certWrapper) return;

    modalContainer.appendChild(certWrapper);
    certWrapper.style.transform = "scale(0.8)";
    modal.style.display = "flex";
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.transition = "opacity 0.3s ease";
      modal.style.opacity = "1";
    }, 10);
  };

  window.closeCertModal = () => {
    const modal = document.getElementById("certModal");
    const certWrapper = document.getElementById("certTransformWrapper");
    const originalContainer = document.querySelector("#certPreviewBox > div");
    if (!modal || !originalContainer || !certWrapper) return;

    modal.style.opacity = "0";
    setTimeout(() => {
      originalContainer.appendChild(certWrapper);
      certWrapper.style.transform = "scale(0.403)";
      modal.style.display = "none";
    }, 300);
  };

  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");
  if (idFromUrl && certIdInput) {
    certIdInput.value = normalizeCertificateId(idFromUrl);
    verifyCertificate();
  } else {
    activateStep(1);
  }
});
