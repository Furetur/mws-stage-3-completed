let restaurant;
var map;


document.addEventListener('DOMContentLoaded', async (event) => {
  console.info('%c Loading...', 'color: orange;');

  showSpinner();

  let restaurants;

  try {
    restaurants = await DBHelper.fetchRestaurants();
  } catch(e) {
    if (e instanceof EmptyStorageError) {
      // the storage is empty
      restaurants = await DBHelper.fetchNewData();
      await DBHelper.putData(restaurants);

    } else {
      console.error(e);
    }
  }

  setDropdowns(restaurants);

  hideSpinner();

  registerServiceWorker();

  try {
    await updateRestaurants();
  } catch(e) {
    console.error('Shit fuck', e);
  }

  console.info('%c Loaded!', 'color: green;');
});



/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  registerServiceWorker();
  fetchRestaurantFromURL().then(restaurant => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false
    });
    fillBreadcrumb();
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }).catch(console.error);
}

const registerServiceWorker = () => {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'});
  }
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }

  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    return Promise.reject('No restaurant id in URL');
  }
  return DBHelper.fetchRestaurantById(id).then((restaurant) => {
    self.restaurant = restaurant;
    fillRestaurantHTML();
    return restaurant;
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
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
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
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
  date.innerHTML = review.date;
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
const fillBreadcrumb = (restaurant=self.restaurant) => {
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
  pickedId = id;
  picker.setAttribute('rating', id + 1);
  picker.setAttribute('aria-valuenow', id + 1);
  picker.setAttribute('aria-valuetext', `${id + 1} out of 5`); 
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

const onSubmit = () => {
  const name = nameField.value;
  const comments = reviewField.value;
  const rating = picker.getAttribute('rating');

  const review = {
    restaurant_id: getParameterByName('id'),
    name: name,
    rating: rating,
    commments: comments,
  }

  saveReviewLocally(review);  
  displayLocallyCreatedReview(review);
}

const offlineChangesStore = localforage.createInstance({
  name: 'offlineChangesStore',
})

const saveReviewLocally = (review) => {
  offlineChangesStore.length().then(lastIndex => {
    const key = `${lastIndex}-review`;
    return localforage.setItem(key, review);
  })
}

const displayLocallyCreatedReview = (review) => {
  review.data = new Date()
  const reviewElement = createReviewHTML(review);
  self.restaurant.reviews = [review, ...self.restaurant.reviews];
  fillReviewsHTML();
}

submitButton.addEventListener('click', onSubmit);
