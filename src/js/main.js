const LOAD_FIRST_CARDS = 1;

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


/**
 * Fetch neighborhoods and cuisines while the page is loading
 */



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


window.addEventListener('load', async () => {
  console.info('%c Idling...', 'color: purple;');
  const startTime = Date.now();

  // await DBHelper.updateData();
  // await fetchAll();

  const endTime = Date.now();

  console.log(`%c Idled for ${endTime - startTime}ms`, 'color: purple;')
});


const fetchAll = () => {
  return Promise.all(
    [fetchNeighborhoods(), fetchCuisines()]
  )
}

const setDropdowns = (restaurants) => {
  setNeighborhoods(restaurants);
  setCuisines(restaurants);
}

const setCuisines = (restaurants) => {
  const cuisines = getCuisinesFromRestaurants(restaurants);
  fillCuisinesHTML(cuisines);
}

const setNeighborhoods = (restaurants) => {
  const neighborhoods = getNeighborhoodsFromRestaurants(restaurants);
  fillNeighborhoodsHTML(neighborhoods);
}

const getCuisinesFromRestaurants = (restaurants) => {
  return restaurants.map((v, i) => restaurants[i].cuisine_type)
    .filter((v, i, cuisines) => cuisines.indexOf(v) == i)
}

const getNeighborhoodsFromRestaurants = (restaurants) => {
  // Get all neighborhoods from all restaurants
  return restaurants.map((v, i) => restaurants[i].neighborhood)
    // Remove duplicates from neighborhoods
    .filter((v, i, neighborhoods) => neighborhoods.indexOf(v) == i);
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

const showSpinner = () => {
  document.querySelector('.spinner').style.display = 'block';
}

const hideSpinner = () => {
  document.querySelector('.spinner').style.display = 'none';
}

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


const getCardsToPreload = () => getCards().slice(0, LOAD_FIRST_CARDS);


/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  return DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
    return neighborhoods;
  });
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
    return cuisines;
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
    fillRestaurantsHTML(restaurants);
    implementLazyLoading(getCardsToPreload());
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
  more.classList.add('action-button')
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View details for ${restaurant.name}`);

  cardAction.append(more);

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
