/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL).then(res => res.json());
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return fetch(DBHelper.DATABASE_URL + `/${id}`).then(res => res.json());
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
  static fetchNeighborhoods(callback) {
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
