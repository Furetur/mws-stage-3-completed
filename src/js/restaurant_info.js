const mapLoaded = new Promise(resolve => {
  window.initMap = () => {
    resolve();
  }
})


document.addEventListener('DOMContentLoaded', async (event) => {
  console.info('%c Loading...', 'color: orange;');

  showSpinner();

  const restaurantId = getRestaurantIdFromUrl();
  let restaurant;

  try {
    console.log('Trying to get restaurant from the cache');
    restaurant = await DBHelper.getRestaurantById(restaurantId);
  } catch(e) {
    if (e instanceof NoRestaurantFoundError) {
      // the storage is empty
      console.log('failed. Trying to fetch the restaurant')
      try {
        restaurant = await DBHelper.fetchRestaurantById(restaurantId);
      } catch(e) {
        throw e;
      }
      console.log('putting the restaurant')
      await DBHelper.putRestaurant(restaurant);
    } else {
      console.error(e);
    }
  }

  fillBreadcrumb(restaurant);

  fillRestaurantHTML(restaurant);

  mapLoaded.then(() => {
    // when map has loaded
    prepareMap(restaurant)
  });
  
  hideSpinner();
  
  registerServiceWorker();
  
  console.info('%c Loaded!', 'color: green;');

  let reviews;

  try {
    console.log('Trying to get reviews from the cache')
    reviews = await DBHelper.getReviewsForRestaurant(restaurantId);
  } catch (e) {
    if (e instanceof EmptyStorageError) {
      console.log('failed. No reviews are found in cache');
      try {
        console.log('Trying to fetch reviews');
        reviews = await DBHelper.fetchReviewsForRestaurant(restaurantId)
      } catch(e) {
        throw e;
      }
    }
  }

  const localRequests = await DBHelper.getAllLocallySavedRequestsByRestaurant(restaurantId);

  const allReviews = [...getLocalReviews(localRequests), ...reviews]

  lazyLoadReviewsSection(allReviews);
  setUpReviewForm(allReviews);
  setUpFavoriteButton(restaurant, getLocalFav(localRequests));

  // update db in background
  await DBHelper.updateInBackground();

});

const getLocalReviews = (localRequests) => {
  localRequests = localRequests || [];
  return localRequests.filter(req => req.type === 'review').map(review => review.body);
}

const getLocalFav = (localRequests) => {
  localRequests = localRequests || []

  const savedRequest = localRequests.find(req => req.type === 'fav');
  
  if (!savedRequest) {
    return null;
  }
  return savedRequest.body;
}

// --------------------------
// Lazyloading
// --------------------------

const lazyLoadReviewsSection = (reviews,) => {
  const showReviews = ([entry]) => {
    if (!entry.isIntersecting) {
      return;
    }
    console.log('Showing reviews')
    fillReviewsHTML(reviews);
    observer.unobserve(entry.target);
  }

  const observer = new IntersectionObserver(showReviews);
  observer.observe(reviewsContainer);
}

// --------------------------
// Spinner
// --------------------------

const spinner = document.querySelector('.spinner');
const restaurantAndReviewsContainer = document.querySelector('#restaurant-and-reviews');
const restaurantContainer = document.querySelector('#restaurant-container');
const reviewsContainer = document.querySelector('#reviews-container');

const showSpinner = () => {
  spinner.style.display = 'block';
  restaurantContainer.style.display = 'none';
  reviewsContainer.style.display = 'none';
  restaurantAndReviewsContainer.classList.add('vertically-centered-content');
}

const hideSpinner = () => {
  spinner.style.display = 'none';
  restaurantContainer.style.display = 'flex';
  reviewsContainer.style.display = 'block';
  restaurantAndReviewsContainer.classList.remove('vertically-centered-content');
}

const registerServiceWorker = () => {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'});
  }
}


const getRestaurantIdFromUrl = () => {
  const id = getParameterByName('id');
  if (!id) {
    throw new Error('No id found in the URL');
  }
  return id;
}


/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  // the alt text is declared in the restaurant.html file,
  // but when I submitted the project, the reviewer didn't spot it there
  // so I decided to also declare it here, just in case.

  // sorry for the last error here, it wasn't really smart lol
  image.alt = `Photo of the ${restaurant.name} restaurant`;

  const imageFile = DBHelper.imageUrlForRestaurant(restaurant);

  image.src = `${imageFile}-480.jpg`;
  image.srcset = `${imageFile}-480.jpg 1x, ${imageFile}-800.jpg 2x`;


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  const tbody = hours.querySelector('tbody');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
    day.classList.add('left')
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.classList.add('right')
    const timeSpan = document.createElement('span');
    timeSpan.innerHTML = operatingHours[key];
    time.appendChild(timeSpan);
    row.appendChild(time);

    tbody.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const reviewsContainer = document.getElementById('reviews-list');
  reviewsContainer.innerHTML = ''

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    reviewsContainer.appendChild(noReviews);
    return;
  }
  reviews.forEach(review => {
    reviewsContainer.appendChild(createReviewHTML(review));
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.classList.add('card');

  const name = document.createElement('span');
  name.classList.add('username');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('span');
  date.classList.add('date');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.classList.add('rating');
  rating.innerHTML = '★'.repeat(review.rating);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.classList.add('comments');
  comments.innerHTML = review.comments;

  li.appendChild(comments);

  return li;
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page'); // to indicate that it represents the current page.
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Review stars

const picker = document.querySelector('.rating-stars-picker');
const stars = document.querySelectorAll('.star');

let pickedId = null;

const onStarMouseOver = (event) => {
  const id = event.target.id;
  clearStars();
  fillStars(id);
}

const onStarMouseClick = (event) => {
  const id = event.target.id;
  saveRating(id);
}

const saveRating = (id) => {
  pickedId = parseInt(id);
  picker.setAttribute('rating', pickedId + 1);
  picker.setAttribute('aria-valuenow', pickedId + 1);
  picker.setAttribute('aria-valuetext', `${pickedId + 1} out of 5`); 
}

const onPickerMouseOut = () => {
  clearStars();
  if (pickedId != null) {
    fillStars(pickedId);
  }
}

const displayRating = (id) => {
  clearStars();
  fillStars(id);
}

const clearStars = () => {
  stars.forEach(star => star.textContent = '☆');
}

const fillStars = (id) => {
  id = parseInt(id);
  const starsToBeFilled = Array.from(stars).slice(0, id + 1);
  starsToBeFilled.forEach(star => star.textContent = '★');
}

picker.addEventListener('mouseout', onPickerMouseOut);

stars.forEach(star => {
  star.addEventListener('click', onStarMouseClick);
  star.addEventListener('mouseover', onStarMouseOver);
});

picker.addEventListener('keydown', (event) => {
  switch(event.keyCode) {
    case 38: // arrow up
    case 39: // arrow right
      // increase rating
      if (pickedId == null) {
        pickedId = 0;
      } else if (pickedId === 4) {
        pickedId = 0;
      } else {
        pickedId++;
      }
      displayRating(pickedId);
      saveRating(pickedId);
      break;
    case 37: // arrow left
    case 40: // arrow down
      // lower rating
      if (pickedId == null) {
        pickedId = 4;
      } else if (pickedId == 0) {
        pickedId = 4;
      } else {
        pickedId--;
      }
      displayRating(pickedId);
      saveRating(pickedId);
      break;
  }
});


// Form Submission

const nameField = document.querySelector('#reviewer-name-field');
const reviewField = document.querySelector('#review-comment-field');

const submitButton = document.querySelector('#submit-review');



const saveReviewLocally = async (review) => {
  review.createdAt = Date.now();
  await DBHelper.saveRequestLocally(review.restaurant_id, 'review', review);
  return review;
}

const displayLocallyCreatedReview = (review) => {
  const reviewElement = createReviewHTML(review);
  fillReviewsHTML([review, ...self.restaurant.reviews]);
}

const setUpReviewForm = (reviews) => {
  const onSubmit = async () => {
    const restaurantId = getParameterByName('id');
    const name = nameField.value;
    const comments = reviewField.value;
    const rating = picker.getAttribute('rating');
  
    const review = {
      restaurant_id: restaurantId,
      name: name,
      rating: rating,
      comments: comments,
    }
  
    const savedReview = await saveReviewLocally(review);
    reviews = [savedReview, ...reviews];
    fillReviewsHTML(reviews);
    DBHelper.tryUploadingLocalRequests();
  }

  submitButton.addEventListener('click', onSubmit);
}

// -------------------------
// Fav Button
// -------------------------

const favButton = document.querySelector('#add-restaurant-to-favorites');

const parseBoolean = x => x === 'true' || x === true;

const setUpFavoriteButton = (restaurant, localFav) => {
  let isFavorite;
  if (!localFav || !localFav.fav) {
    isFavorite = parseBoolean(restaurant.is_favorite);
  } else {
    isFavorite = parseBoolean(localFav);
  }
  
  updateFavButton(isFavorite);

  const onFavButtonClick = async () => {
    isFavorite = !isFavorite;
    updateFavButton(isFavorite);
    if (isFavorite) {
      saveFav(restaurant, true);
    } else {
      saveFav(restaurant, false);
    }
    await DBHelper.tryUploadingLocalRequests();
    // update db in background
      await DBHelper.updateInBackground();
  }

  favButton.addEventListener('click', onFavButtonClick);
}



const updateFavButton = (isToggled) => {
  if (isToggled) {
    favButton.classList.add('toggled-fav-button');
    return;
  }
  favButton.classList.remove('toggled-fav-button');
}

const saveFav = (restaurant, status) => {
  return DBHelper.saveRequestLocally(restaurant.id, 'fav', {
    restaurant_id: restaurant.id,
    fav: status,
  }, favFilter);
}

/**
 * Returns false if the request is fav
 * @param {Object} request 
 */
const favFilter = (request) => request.type !== 'fav';

/**
 * Sets up the map
 */

const showMapButton = document.querySelector('#show-map-button');

const prepareMap = (restaurant) => {
  console.log('Map is ready to be shown');
  showMapButton.textContent = 'Show the map';
  showMapButton.addEventListener('click', () => {
    try {
      showMap(restaurant);
      showMapButton.style.display = 'none';
    } catch(e) {
      showMapButton.textContent = 'Error showing the map';
    }
  })
}

const showMap = (restaurant) => {
  console.log('showing the map')
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });
  DBHelper.mapMarkerForRestaurant(restaurant, map);
}
