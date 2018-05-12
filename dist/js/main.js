"use strict";var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var map,DBHelper=function(){function a(){_classCallCheck(this,a)}return _createClass(a,null,[{key:"fetchRestaurants",value:function(b){var c=new XMLHttpRequest;c.open("GET",a.DATABASE_URL),c.onload=function(){if(200===c.status){var a=JSON.parse(c.responseText),d=a.restaurants;b(null,d)}else{var e="Request failed. Returned status of "+c.status;b(e,null)}},c.send()}},{key:"fetchRestaurantById",value:function(b,c){a.fetchRestaurants(function(a,d){if(a)c(a,null);else{var e=d.find(function(a){return a.id==b});e?c(null,e):c("Restaurant does not exist",null)}})}},{key:"fetchRestaurantByCuisine",value:function(b,c){a.fetchRestaurants(function(a,d){if(a)c(a,null);else{var e=d.filter(function(a){return a.cuisine_type==b});c(null,e)}})}},{key:"fetchRestaurantByNeighborhood",value:function(b,c){a.fetchRestaurants(function(a,d){if(a)c(a,null);else{var e=d.filter(function(a){return a.neighborhood==b});c(null,e)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(b,c,d){a.fetchRestaurants(function(a,e){if(a)d(a,null);else{var f=e;"all"!=b&&(f=f.filter(function(a){return a.cuisine_type==b})),"all"!=c&&(f=f.filter(function(a){return a.neighborhood==c})),d(null,f)}})}},{key:"fetchNeighborhoods",value:function(b){a.fetchRestaurants(function(a,c){if(a)b(a,null);else{var d=c.map(function(a,b){return c[b].neighborhood}),e=d.filter(function(a,b){return d.indexOf(a)==b});b(null,e)}})}},{key:"fetchCuisines",value:function(b){a.fetchRestaurants(function(a,c){if(a)b(a,null);else{var d=c.map(function(a,b){return c[b].cuisine_type}),e=d.filter(function(a,b){return d.indexOf(a)==b});b(null,e)}})}},{key:"urlForRestaurant",value:function(a){return"./restaurant.html?id="+a.id}},{key:"imageUrlForRestaurant",value:function(a){return"/img/"+a.photograph}},{key:"mapMarkerForRestaurant",value:function(b,c){var d=new google.maps.Marker({position:b.latlng,title:b.name,url:a.urlForRestaurant(b),map:c,animation:google.maps.Animation.DROP});return d}},{key:"DATABASE_URL",get:function(){return"/data/restaurants.json"}}]),a}(),restaurants=void 0,neighborhoods=void 0,cuisines=void 0,markers=[];document.addEventListener("DOMContentLoaded",function(){registerServiceWorker(),fetchNeighborhoods(),fetchCuisines()});var registerServiceWorker=function(){"serviceWorker"in navigator&&navigator.serviceWorker.register("./sw.js",{scope:"./"})},fetchNeighborhoods=function(){DBHelper.fetchNeighborhoods(function(a,b){a?console.error(a):(self.neighborhoods=b,fillNeighborhoodsHTML())})},fillNeighborhoodsHTML=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:self.neighborhoods,b=document.getElementById("neighborhoods-select");a.forEach(function(a){var c=document.createElement("option");c.innerHTML=a,c.value=a,b.append(c)})},fetchCuisines=function(){DBHelper.fetchCuisines(function(a,b){a?console.error(a):(self.cuisines=b,fillCuisinesHTML())})},fillCuisinesHTML=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:self.cuisines,b=document.getElementById("cuisines-select");a.forEach(function(a){var c=document.createElement("option");c.innerHTML=a,c.value=a,b.append(c)})};window.initMap=function(){self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),updateRestaurants()};var updateRestaurants=function(){var a=document.getElementById("cuisines-select"),b=document.getElementById("neighborhoods-select"),c=a.selectedIndex,d=b.selectedIndex,e=a[c].value,f=b[d].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(e,f,function(a,b){a?console.error(a):(resetRestaurants(b),fillRestaurantsHTML())})},resetRestaurants=function(a){self.restaurants=[];var b=document.getElementById("restaurants-list");b.innerHTML="",self.markers.forEach(function(a){return a.setMap(null)}),self.markers=[],self.restaurants=a},fillRestaurantsHTML=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:self.restaurants,b=document.getElementById("restaurants-list");a.forEach(function(a){b.append(createRestaurantHTML(a))}),addMarkersToMap()},createRestaurantHTML=function(a){var b=document.createElement("li");b.classList.add("card");var c=DBHelper.imageUrlForRestaurant(a),d=createResponsiveImageFor(c);d.className="restaurant-img",b.append(d);var e=document.createElement("div");e.classList.add("content"),b.append(e);var f=document.createElement("h2");f.innerHTML=a.name,e.append(f);var g=document.createElement("p");g.innerHTML=a.neighborhood,e.append(g);var h=document.createElement("p");h.innerHTML=a.address,e.append(h);var i=document.createElement("div");i.classList.add("card-action"),b.append(i);var j=document.createElement("a");return j.innerHTML="View Details",j.href=DBHelper.urlForRestaurant(a),j.setAttribute("aria-label","View details for "+a.name),i.append(j),b},createResponsiveImageFor=function(a){a=a.slice(0,-4);var b=document.createElement("img");return b.src=a+"-360.jpg",b.srcset=a+"-360.jpg 1x, "+a+"-800.jpg 2x",b.alt="Photo of the restaurant",b},addMarkersToMap=function(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:self.restaurants;a.forEach(function(a){var b=DBHelper.mapMarkerForRestaurant(a,self.map);google.maps.event.addListener(b,"click",function(){window.location.href=b.url}),self.markers.push(b)})};