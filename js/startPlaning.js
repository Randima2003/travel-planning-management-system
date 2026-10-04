document.addEventListener('DOMContentLoaded', () => {
  const tripParams = new URLSearchParams(window.location.search);
  const destination = tripParams.get('destination')?.trim() || 'Sri Lankan Paradises';
  const startDate = tripParams.get('startDate') || '';
  const endDate = tripParams.get('endDate') || '';
  const privacyLabels = {
    friends: 'Friends',
    private: 'Private',
    public: 'Public'
  };
  const privacy = tripParams.get('privacy');
  const privacyLabel = privacyLabels[privacy] || privacyLabels.friends;
  let tripDays = [{ id: 1, dateStr: 'Day 1', items: [] }];

  // DOM Elements
  const itineraryDaysList = document.getElementById('itineraryDaysList');
  const totalBudgetDisplay = document.getElementById('totalBudgetDisplay');
  const dateModal = document.getElementById('dateModal');
  const openDateModalBtn = document.getElementById('openDateModalBtn');
  const closeDateModalBtn = document.getElementById('closeDateModalBtn');
  const cancelDateBtn = document.getElementById('cancelDateBtn');
  const saveDatesBtn = document.getElementById('saveDatesBtn');
  const selectedDateBadge = document.getElementById('selectedDateBadge');
  const dateRangeDisplay = document.getElementById('dateRangeDisplay');
  const changeDatesBtn = document.getElementById('changeDatesBtn');
  const tripTitle = document.getElementById('tripTitle');
  const tripSummary = document.getElementById('tripSummary');
  const tripPrivacyBadge = document.getElementById('tripPrivacyBadge');

  tripTitle.textContent = `Explore ${destination}`;
  tripPrivacyBadge.textContent = `${privacyLabel.toUpperCase()} TRIP`;
  document.title = `${destination} itinerary - VentureVista`;

  if (startDate && endDate && startDate <= endDate) {
    document.getElementById('startDateInput').value = startDate;
    document.getElementById('endDateInput').value = endDate;
    dateRangeDisplay.textContent = `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    selectedDateBadge.classList.remove('hidden');
    tripSummary.textContent = `${formatLongDate(startDate)} - ${formatLongDate(endDate)} · ${privacyLabel} trip`;
    tripDays = createDaysFromRange(parseLocalDate(startDate), parseLocalDate(endDate));
  } else {
    tripSummary.textContent = `${privacyLabel} trip · Choose dates to create your itinerary.`;
  }

  renderItinerary();

  // Event Listeners for Date Modal
  openDateModalBtn.addEventListener('click', () => dateModal.classList.add('active'));
  changeDatesBtn.addEventListener('click', () => dateModal.classList.add('active'));
  closeDateModalBtn.addEventListener('click', () => dateModal.classList.remove('active'));
  cancelDateBtn.addEventListener('click', () => dateModal.classList.remove('active'));

  saveDatesBtn.addEventListener('click', () => {
    const startVal = document.getElementById('startDateInput').value;
    const endVal = document.getElementById('endDateInput').value;

    if (startVal && endVal) {
      generateDaysFromRange(new Date(startVal), new Date(endVal));
      dateRangeDisplay.textContent = `${formatShortDate(startVal)} - ${formatShortDate(endVal)}`;
      selectedDateBadge.classList.remove('hidden');
      tripSummary.textContent = `${formatLongDate(startVal)} - ${formatLongDate(endVal)} · ${privacyLabel} trip`;
      dateModal.classList.remove('active');
    }
  });

  if (window.L && document.getElementById('map')) {
    try {
      initMap();
    } catch (error) {
      console.error('Map initialization failed:', error);
    }
  }

  // Render Itinerary Days & Items
  function renderItinerary() {
    itineraryDaysList.innerHTML = '';
    let grandTotal = 0;

    tripDays.forEach((day, index) => {
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';

      let dayItemsHtml = '';
      day.items.forEach(item => {
        grandTotal += item.cost;
        dayItemsHtml += `
          <div class="itinerary-item">
            <div class="item-left">
              <i class="fa-solid fa-location-pin" style="color: var(--brand-primary);"></i>
              <span class="item-name">${item.name}</span>
            </div>
            <div class="item-right">
              <span class="item-cost-badge">LKR ${item.cost.toLocaleString()}</span>
              <button class="icon-btn" onclick="removeItem(${day.id}, ${item.id})" style="margin-left: 0.5rem; font-size: 0.75rem;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        `;
      });

      dayCard.innerHTML = `
        <div class="day-header">
          <span class="day-title">${day.dateStr}</span>
          <div class="day-controls">
            <button class="day-control-btn"><i class="fa-solid fa-route"></i> Auto-fill day</button>
            <button class="day-control-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> Optimize route</button>
          </div>
        </div>
        <div class="day-items-list">
          ${dayItemsHtml.length > 0 ? dayItemsHtml : '<p style="font-size:0.75rem; color:#94a3b8;">No places added for this day yet.</p>'}
        </div>
        <div class="add-item-box">
          <input type="text" id="input-name-${day.id}" placeholder="Add a place or activity">
          <input type="number" id="input-cost-${day.id}" placeholder="Cost (LKR)">
          <button class="btn-primary" onclick="addNewItem(${day.id})">+ Add</button>
        </div>
      `;

      itineraryDaysList.appendChild(dayCard);
    });

    // Update Overall Budget Display
    totalBudgetDisplay.textContent = `LKR ${grandTotal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Add Item Function
  window.addNewItem = function(dayId) {
    const nameInput = document.getElementById(`input-name-${dayId}`);
    const costInput = document.getElementById(`input-cost-${dayId}`);

    const name = nameInput.value.trim();
    const cost = parseFloat(costInput.value) || 0;

    if (name) {
      const targetDay = tripDays.find(d => d.id === dayId);
      if (targetDay) {
        targetDay.items.push({
          id: Date.now(),
          name: name,
          cost: cost
        });
        renderItinerary();
      }
    }
  };

  // Remove Item Function
  window.removeItem = function(dayId, itemId) {
    const targetDay = tripDays.find(d => d.id === dayId);
    if (targetDay) {
      targetDay.items = targetDay.items.filter(i => i.id !== itemId);
      renderItinerary();
    }
  };

  // Add Suggested Place from Explore Section
  window.addSuggestedPlace = function(placeName, estimatedCost) {
    if (tripDays.length > 0) {
      tripDays[0].items.push({
        id: Date.now(),
        name: placeName,
        cost: estimatedCost
      });
      renderItinerary();
      alert(`"${placeName}" has been added to Day 1!`);
    }
  };

  // Generate Days from Date Range
  function generateDaysFromRange(start, end) {
    tripDays = createDaysFromRange(start, end);
    renderItinerary();
  }

  function createDaysFromRange(start, end) {
    const newDays = [];
    let current = new Date(start);
    let idCounter = 1;

    const options = { weekday: 'long', month: 'long', day: 'numeric' };

    while (current <= end) {
      newDays.push({
        id: idCounter,
        dateStr: current.toLocaleDateString('en-US', options),
        items: []
      });
      current.setDate(current.getDate() + 1);
      idCounter++;
    }

    return newDays;
  }

  function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatShortDate(dateStr) {
    const date = parseLocalDate(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function formatLongDate(dateStr) {
    return parseLocalDate(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Leaflet Map Initialization
  function initMap() {
    const map = L.map('map').setView([7.8731, 80.7718], 8); // Sri Lanka Center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Sri Lanka Sample Markers
    const locations = [
      { name: "Sigiriya Rock Fortress", lat: 7.9570, lng: 80.7603 },
      { name: "Kandy Temple of Tooth", lat: 7.2906, lng: 80.6337 },
      { name: "Ella Nine Arches", lat: 6.8768, lng: 81.0608 },
      { name: "Mirissa Beach", lat: 5.9483, lng: 80.4716 }
    ];

    locations.forEach(loc => {
      L.marker([loc.lat, loc.lng])
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b>`);
    });
  }

});