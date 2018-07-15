/**
 * Common database helper functions.
 */
class EmptyStorageError extends Error {

}

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
  }

  /**
   * Fetch new data
   */
  static fetchNewData() {
    return fetch(DBHelper.DATABASE_URL)
      .then(res => res.json())
  }

  /**
   * Clear the IDB and put the new data
   */

  static putData(data) {
    return localforage.clear().then(() => {
      const promises = data.map(restaurant => localforage.setItem(restaurant.id, restaurant));
      return Promise.all(promises);
    });
  }

  static isEmpty(data) {
    return localforage.length().then(length => {
      return length === 0;
    });
  }

  /**
   * Update the IDB
   */
  static updateData() {
    return fetch(DBHelper.DATABASE_URL)
      .then(res => res.json())
      .then(restaurants => {
        return localforage.clear().then(() => {
          return restaurants;
        });
      })
      .then(restaurants => {
        const promises = restaurants.map(restaurant => localforage.setItem(restaurant.id, restaurant));
        return Promise.all(promises);
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return localforage.keys().then(keys => {
      if (keys.length === 0) {
        throw new EmptyStorageError();
      }
      const promises = keys.map(key => localforage.getItem(key));
      return Promise.all(promises);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return localforage.getItem(id);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants().then(restaraunts => {
      return restaurants.filter(r => r.cuisine_type == cuisine);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    return DBHelper.fetchRestaurants().then(restaraunts => {
      return restaurants.filter(r => r.neighborhood == neighborhood);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (cuisine != 'all') { // filter by cuisine
        return restaurants.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        return restaurants.filter(r => r.neighborhood == neighborhood);
      }
      
      return restaurants;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants().then(restaurants =>
      restaurants
        // Get all neighborhoods from all restaurants
        .map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        .filter((v, i, neighborhoods) => neighborhoods.indexOf(v) == i)
    );
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    return DBHelper.fetchRestaurants().then(restaurants => 
      restaurants
        .map((v, i) => restaurants[i].cuisine_type)
        .filter((v, i, cuisines) => cuisines.indexOf(v) == i)
    );
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

}
