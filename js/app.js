document.addEventListener('DOMContentLoaded', () => {
  // 1. "See more reviews" Event listener
  const moreReviewsBtn = document.getElementById('moreReviewsBtn');
  const reviewsContainer = document.getElementById('reviewsContainer');

  const additionalReviews = [
    {
      name: 'Belinda and Kathy Kohles',
      stars: '★★★★★',
      text: 'I have used several trip planning apps. This one by far is the best. The interaction between google maps makes planning so much easier.'
    },
    {
      name: 'Jorge D.',
      stars: '★★★★★',
      text: 'It left me speechless that I can add places to my trip and they get automatically populated with a featured pic and description.'
    }
  ];

  if (moreReviewsBtn) {
    moreReviewsBtn.addEventListener('click', () => {
      additionalReviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'card review-card';
        card.innerHTML = `
          <div class="user-info">
            <div class="avatar">${review.name.charAt(0)}</div>
            <div>
              <h4>${review.name}</h4>
            </div>
          </div>
          <div class="stars">${review.stars}</div>
          <p>${review.text}</p>
        `;
        reviewsContainer.appendChild(card);
      });

      // Disable button after loading
      moreReviewsBtn.style.display = 'none';
    });
  }

  // 2. Smooth Scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
});