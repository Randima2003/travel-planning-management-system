document.addEventListener('DOMContentLoaded', () => {
  const destinationInput = document.getElementById('destination');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const privacySelect = document.getElementById('privacySelect');
  const startPlanningBtn = document.getElementById('startPlanningBtn');
  const inviteBtn = document.getElementById('inviteBtn');

  if (!destinationInput || !startDateInput || !endDateInput || !privacySelect || !startPlanningBtn) {
    return;
  }

  // Start Planning Action
  startPlanningBtn.addEventListener('click', () => {
    const destination = destinationInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const privacy = privacySelect.value;

    if (!destination) {
      alert('Please enter a destination to start planning!');
      destinationInput.focus();
      return;
    }

    const tripData = {
      destination,
      startDate: startDate || 'Not specified',
      endDate: endDate || 'Not specified',
      privacy
    };

    console.log('Trip Planning Initiated:', tripData);
    alert(`Starting your trip plan for ${destination}!`);
  });

  // Invite Button Action
  inviteBtn?.addEventListener('click', () => {
    const email = prompt('Enter the email of your tripmate:');
    if (email) {
      alert(`Invitation sent to ${email}`);
    }
  });
});