document.addEventListener('DOMContentLoaded', () => {
  const visitorsInput = document.getElementById('numberOfVisitors');
  const feeCalculationText = document.getElementById('feeCalculationText');
  const totalFeeText = document.getElementById('totalFeeText');
  const permitForm = document.getElementById('permitForm');

  const RATE_PER_PERSON = 500; // LKR 500 per person

  // 1. Dynamic Fee Calculation
  function updateFee() {
    const visitors = parseInt(visitorsInput.value) || 0;
    const total = visitors * RATE_PER_PERSON;

    feeCalculationText.textContent = `${visitors} visitors × LKR ${RATE_PER_PERSON}`;
    totalFeeText.textContent = `LKR ${total.toLocaleString()}`;
  }

  visitorsInput.addEventListener('input', updateFee);

  // 2. File Upload Handling
  setupFileInput('idDocument', 'idDocPreview', 'idDocName');
  setupFileInput('itineraryDocument', 'itineraryDocPreview', 'itineraryDocName');

  function setupFileInput(inputId, previewId, nameId) {
    const fileInput = document.getElementById(inputId);
    const previewCard = document.getElementById(previewId);
    const fileNameSpan = document.getElementById(nameId);

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameSpan.textContent = file.name;
        previewCard.style.display = 'flex';
      }
    });
  }

  window.removeFile = function (inputId) {
    const fileInput = document.getElementById(inputId);
    fileInput.value = '';
    
    if (inputId === 'idDocument') {
      document.getElementById('idDocPreview').style.display = 'none';
    } else if (inputId === 'itineraryDocument') {
      document.getElementById('itineraryDocPreview').style.display = 'none';
    }
  };

  // 3. Connect Form Submission to Spring Boot Backend API
  permitForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const requestBody = {
      fullName: document.getElementById('fullName').value,
      nationality: document.getElementById('nationality').value,
      idType: document.getElementById('idType').value,
      idNumber: document.getElementById('idNumber').value,
      email: document.getElementById('email').value,
      mobileNumber: document.getElementById('mobileNumber').value,
      residentialAddress: document.getElementById('residentialAddress').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      purposeOfVisit: document.getElementById('purposeOfVisit').value,
      numberOfVisitors: parseInt(visitorsInput.value),
      entryPoint: document.getElementById('entryPoint').value,
      plannedTrailArea: document.getElementById('plannedTrailArea').value,
      additionalInformation: document.getElementById('additionalInformation').value,
      declarationAccepted: document.getElementById('declaration').checked
    };

    const idFile = document.getElementById('idDocument').files[0];
    const itineraryFile = document.getElementById('itineraryDocument').files[0];

    const formData = new FormData();
    formData.append("request", new Blob([JSON.stringify(requestBody)], { type: "application/json" }));
    if (idFile) formData.append("idDocument", idFile);
    if (itineraryFile) formData.append("itineraryDocument", itineraryFile);

    try {
      const response = await fetch('http://localhost:8080/api/permits/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Permit Request Submitted Successfully! Reference ID: #${result.id}`);
      } else {
        alert('Failed to submit request. Please check required fields.');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      alert('Could not connect to backend server!');
    }
  });
});