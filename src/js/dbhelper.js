/**
 * Common database helper functions.
 */
class EmptyStorageError extends Error {

}

class NoRestaurantFoundError extends Error {

}

const restaurantsStore = localforage.createInstance({
  name: 'restaurantsStore',
});

const reviewsStore = localforage.createInstance({
  name: 'reviewsStore',
});

const offlineRequestsStore = localforage.createInstance({
  name: 'offlineRequestsStore',
});


class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANTS_URL() {
    return `http://localhost:1337/restaurants`;
  }

  static get REVIEWS_URL() {
    return `http://localhost:1337/reviews`;
  }

  
  static get POST_REVIEW_URL() {
    return `http://localhost:1337/reviews/`;
  }
  
  static PUT_FAV_URL(restaurantId, fav) {
    return `http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${fav}`;
  }
  // -----------------
  // Online Requests
  // -----------------

  static fetchRestaurants() {
    return fetch(DBHelper.RESTAURANTS_URL).then(res => res.json())
  }

  static fetchRestaurantById(id) {
    return fetch(`${DBHelper.RESTAURANTS_URL}/${id}`).then(res => res.json());
  }

  static fetchReviews() {
    return fetch(DBHelper.REVIEWS_URL).then(res => res.json());
  }
  
  static fetchReviewsForRestaurant(id) {
    return fetch(`${DBHelper.REVIEWS_URL}/?restaurant_id=${id}`).then(r => r.json());  
  }

  /**
   * Clear the IDB and put the new data
   */

  
  
  /**
   * Get all locally saved restaurants.
   */
  static getRestaurants() {
    return restaurantsStore.keys().then(keys => {
      if (keys.length === 0) {
        throw new EmptyStorageError();
      }
      const promises = keys.map(key => restaurantsStore.getItem(key));
      return Promise.all(promises);
    });
  }
  
  /**
   * Save restaraunt locally
   */
  
  static async putRestaurant(restaurant) {
    return restaurantsStore.setItem(restaurant.id.toString(), restaurant);
  }
  
  static putRestaurants(data) {
    const promises = data.map(this.putRestaurant);
    return Promise.all(promises);
  }


  /**
   * Get a locally saved restaurant by its ID.
   */
  static getRestaurantById(id) {
    return restaurantsStore.getItem(id).then(restaurant => {
      if (restaurant == null)
        throw new NoRestaurantFoundError();
      return restaurant;
    });
  }

  /**
   * Get locally saved restaurants by a cuisine type with proper error handling.
   */
  static getRestaurantByCuisine(cuisine) {
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.cuisine_type == cuisine);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static getRestaurantByNeighborhood(neighborhood) {
    return DBHelper.getRestaurants().then(restaurants => {
      return restaurants.filter(r => r.neighborhood == neighborhood);
    });
  }



  /**
   * Get all locally saved neighborhoods with proper error handling.
   */
  static getNeighborhoods() {
    return DBHelper.getRestaurants().then(restaurants =>
      restaurants
        // Get all neighborhoods from all restaurants
        .map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        .filter((v, i, neighborhoods) => neighborhoods.indexOf(v) == i)
    );
  }

  /**
   * Get all locally saved cuisines with proper error handling.
   */
  static getCuisines() {
    return DBHelper.getRestaurants().then(restaurants => 
      restaurants
        .map((v, i) => restaurants[i].cuisine_type)
        .filter((v, i, cuisines) => cuisines.indexOf(v) == i)
    );
  }

  /**
   * Get all locally saved reviews
   */
  static async getReviews() {
    const keys = await reviewsStore.keys();
    if (keys.length === 0) {
      throw new EmptyStorageError();
    }
    const promises = keys.map(key => reviewsStore.getItem(key));
    return Promise.all(promises);
  }

  static async getReviewsForRestaurant(id) {
    try {
      const reviews = await DBHelper.getReviews();
      return reviews.filter(review => review.restaurant_id == id);
    } catch(e) {
      throw e;
    }
  }

  static putReview(review) {
    return reviewsStore.setItem(review.id.toString(), review);
  }

  /**
   * Save reviews locally
   * @param {Array} reviews 
   */
  static putReviews(reviews) {
    const promises = reviews.map(this.putReview);
    return Promise.all(promises);
  }

  // ----------------------
  // OFFLINE REQUESTS STORE
  // ----------------------

  static async saveRequestLocally(restaurantId, type, request, filterFunction = () => true) {
    const savedRequests = await offlineRequestsStore.getItem(restaurantId) || [];
    const filteredSavedRequests = savedRequests.filter(filterFunction);
    const requestToSave = {
      type: type,
      body: request,
    }
    await offlineRequestsStore.setItem(restaurantId, [...filteredSavedRequests, requestToSave]);
  }

  static async getAllLocallySavedRequestsByRestaurant(restaurantId) {
    return offlineRequestsStore.getItem(restaurantId);
  }

  static clearLocalRequests() {
    return offlineRequestsStore.clear();
  }

  static get localRequestHandlers() {
    return {
      'fav': DBHelper.favHandler,
      'review': DBHelper.reviewHandler,
    }
  }

  static favHandler(request) {
    return fetch(DBHelper.PUT_FAV_URL(request.restaurant_id, request.fav), {
      method: 'PUT'
    });
  }

  static reviewHandler(request) {
    return fetch(DBHelper.POST_REVIEW_URL, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  static uploadRequest(request) {
    const handler = DBHelper.localRequestHandlers[request.type];
    return handler(request.body);
  }

  static async uploadLocalRequestsForRestaurant(restaurantId) {
    const requests = await this.getAllLocallySavedRequestsByRestaurant(restaurantId);
    const promises = requests.map(this.uploadRequest);
    return Promise.all(promises);
  }

  static async uploadLocalRequests() {
    const restaurantIds = await offlineRequestsStore.keys();
    const promises = restaurantIds.map(id => DBHelper.uploadLocalRequestsForRestaurant(id));
    return Promise.all(promises);
  }

  // ------------------
  // Waiting for network
  // ------------------

  /**
   * Retries uploading local requests and updating database
   */
  static tryUntilSuceedes(fn) {
    return new Promise(resolve => {
      const action = async () => {
        try {
          const result = await fn();
          clearInterval(interval);
          resolve(result)
          console.log('Action succeded')
        } catch(e) {
          console.log('operation failed due to error', e);
          console.log('waiting')
        }
      }
  
      const interval = setInterval(action, 5000);
    });
  }

  static async tryUploadingLocalRequests() {
    await this.tryUntilSuceedes(this.uploadLocalRequests);
    await DBHelper.clearLocalRequests();
  }

  static tryFetchingRestaurants() {
    return this.tryUntilSuceedes(this.fetchRestaurants);
  }

  static tryFetchingReviews() {
    return this.tryUntilSuceedes(this.fetchReviews);
  }


  
  
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  
  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }
  
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static async updateInBackground() {
    // update the db in the background
    const fetchedRestaurants = await DBHelper.tryFetchingRestaurants();
    await DBHelper.putRestaurants(fetchedRestaurants);
    console.log('Restaurants fetched')

    const fetchedReviews = await DBHelper.tryFetchingReviews();
    await DBHelper.putReviews(fetchedReviews);
    console.log('Reviews fetched');

    // upload all local requests
    await DBHelper.tryUploadingLocalRequests();
    console.log('Requests uploaded');
  }
}
