const LOAD_FIRST_CARDS = 4;

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


/**
 * Fetch neighborhoods and cuisines while the page is loading
 */
document.addEventListener('load', async () => {
  console.info('Loading...');
  await fetchAll();
  await DBHelper.updateData();
  await fetchAll();
});


document.addEventListener('DOMContentLoaded', async (event) => {
  registerServiceWorker();
  await updateRestaurants();

  const cardsToPreload = getCards().slice(0, LOAD_FIRST_CARDS);
  implementLazyLoading(cardsToPreload);
  console.info('Loaded!');
});


const fetchAll = () => {
  return Promise.all(
    [fetchNeighborhoods(), fetchCuisines()]
  )
}


const updateContent = () => {
  fetchNeighborhoods();
  fetchCuisines();
  return updateRestaurants();
};


const registerServiceWorker = () => {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', {scope: './'});
  }
};

const loadFirstCards = () => {
  const cards = getCards().slice(0, LOAD_FIRST_CARDS);
  loadCards(cards);
};

const implementLazyLoading = (cardsToPreload) => {
  const cards = document.querySelectorAll('.card');
  setUpObserver(cards, cardsToPreload);
}


const setUpObserver = (elements, cardsToPreload) => {
  const manageEntry = (entry) => {
    const mustBePreloaded = cardsToPreload.includes(entry.target)

    if (!entry.isIntersecting && !mustBePreloaded) {
      return;
    }

    if (mustBePreloaded) {
      cardsToPreload = cardsToPreload.reduce((arr, cur) => (cur === entry.target)? arr : [...arr, cur], []);
    }

    loadCard(entry.target);
    io.unobserve(entry.target);
  }

  const io = new IntersectionObserver(
    entries => entries.forEach(manageEntry)
  )

  elements.forEach(el => io.observe(el));
}


const loadCard = (card) => {
  if (card.getAttribute('loaded') === 'true') {
    return;
  }

  card.setAttribute('loaded', true);

  const image = card.querySelector('img');
  showResponsiveImage(image);
  console.log('loaded', card.querySelector('h2').textContent);
}


const loadCards = (cards) => cards.forEach(loadCard);


const unloadCard = (card) => {
  if (card.getAttribute('loaded') === 'false') {
    return;
  }
  
  card.setAttribute('loaded', false);

  const image = card.querySelector('img');
  hideResponsiveImage(image);
  console.log('unloaded', card.querySelector('h2').textContent);
}


const getCards = () => Array.from(document.querySelectorAll('.card'));


/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  return DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(console.error);
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  return DBHelper.fetchCuisines().then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.classList.add('card');
  li.setAttribute('loaded', false); // the card is unloaded by default

  const imageName = DBHelper.imageUrlForRestaurant(restaurant);
  const image = prepareImageFor(imageName);
  image.className = 'restaurant-img';
  li.append(image);

  const content = document.createElement('div');
  content.classList.add('content');
  li.append(content)

  // now its h2 instead of h1, because of semantics
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  content.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  content.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  content.append(address);

  const cardAction = document.createElement('div');
  cardAction.classList.add('card-action');
  li.append(cardAction);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View details for ${restaurant.name}`);

  cardAction.append(more)

  return li
}


const prepareImageFor = (imageName) => {
  const image = document.createElement('img');
  image.setAttribute('imagename', imageName);
  image.alt = 'Photo of the restaurant'

  return image;
}


const showResponsiveImage = (imageElement) => {
  const imageName = imageElement.getAttribute('imageName');

  imageElement.src = `${imageName}-360.jpg`;
  imageElement.srcset = `${imageName}-360.jpg 1x, ${imageName}-800.jpg 2x`;
}


const hideResponsiveImage = (imageElement) => {
  imageElement.src = '';
  imageElement.srcset = '';
}

const createResponsiveImageFor = (imageName) => {
  // remove extension
  //imageName = imageName.slice(0, -4);

  const image = document.createElement('img');
  image.src = `${imageName}-360.jpg`;
  image.srcset = `${imageName}-360.jpg 1x, ${imageName}-800.jpg 2x`;
  image.alt = 'Photo of the restaurant'

  return image;
}
/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
