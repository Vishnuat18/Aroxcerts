import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const DB_COLLECTION = 'aroxtech_certificates';

document.addEventListener('DOMContentLoaded', () => {
  const verifyInput = document.getElementById('verifyInput');
  const btnVerify = document.getElementById('btnVerify');
  const verifyError = document.getElementById('verifyError');
  const certDetailsCard = document.getElementById('certDetailsCard');
  
  const vdCertId = document.getElementById('vdCertId');
  const vdName = document.getElementById('vdName');
  const vdDomain = document.getElementById('vdDomain');
  const vdDate = document.getElementById('vdDate');
  
  const badgeValid = document.querySelector('.cert-status-badge.valid');
  const badgeRevoked = document.querySelector('.cert-status-badge.revoked');

  // Check URL for ?id= parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  
  if (urlId) {
    verifyInput.value = urlId;
    verifyCertificate(urlId);
  }

  btnVerify.addEventListener('click', () => {
    const id = verifyInput.value.trim().toUpperCase();
    if (!id) {
      showError("Please enter a Certificate ID.");
      return;
    }
    verifyCertificate(id);
  });

  verifyInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') btnVerify.click();
  });

  async function verifyCertificate(certId) {
    certDetailsCard.style.display = 'none';
    verifyError.textContent = '';
    btnVerify.textContent = 'Checking...';
    btnVerify.disabled = true;

    try {
      const q = query(collection(db, DB_COLLECTION), where("cert_id", "==", certId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showError("Invalid Certificate ID. No records found.");
      } else {
        let certData = null;
        let docId = null;
        querySnapshot.forEach((docSnap) => {
          certData = docSnap.data();
          docId = docSnap.id;
        });

        // Update verification count
        await updateDoc(doc(db, DB_COLLECTION, docId), {
          verifiedCount: increment(1)
        });

        // Display details
        displayDetails(certData);
      }
    } catch (err) {
      console.error(err);
      showError("An error occurred while connecting to the database.");
    } finally {
      btnVerify.textContent = 'Verify';
      btnVerify.disabled = false;
    }
  }

  function showError(msg) {
    verifyError.textContent = msg;
    certDetailsCard.style.display = 'none';
  }

  function displayDetails(data) {
    certDetailsCard.style.display = 'block';
    
    if (data.status === 'REVOKED') {
      badgeValid.style.display = 'none';
      badgeRevoked.style.display = 'inline-flex';
    } else {
      badgeRevoked.style.display = 'none';
      badgeValid.style.display = 'inline-flex';
    }

    vdCertId.textContent = data.cert_id || 'N/A';
    vdName.textContent = data.student_name || 'N/A';
    vdDomain.textContent = data.internship_details || 'N/A';
    
    const issueDateObj = new Date(data.timestamp);
    vdDate.textContent = !isNaN(issueDateObj) ? issueDateObj.toLocaleDateString('en-GB') : 'Unknown';
  }

  // PDF Download (Optional, requires rendering generator off-screen, or we simply link back to the generator)
  const btnDownloadPDF = document.getElementById('btnDownloadPDF');
  if (btnDownloadPDF) {
    btnDownloadPDF.addEventListener('click', () => {
      alert("This feature is currently available only to administrators.");
    });
  }
});
