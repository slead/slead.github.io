let map;
let baseUrl = 'https://smartspace.goodman.com/arcgis/rest/services/PropertyBoundariesTemplate/FeatureServer/0'

function initMap() {

  // retrieve the lat/long/zoom from the data-elements
  var latitude = $("#title").data('latitude');
  var longitude = $("#title").data('longitude')
  var zoom = $("#title").data('zoom') || 15;
  var objectid = $("#title").data('objectid');

  if (latitude && longitude && objectid){
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: latitude, lng: longitude },
      zoom: zoom,
    });

    let url = baseUrl + '/query?outFields=*&returnGeometry=true&f=geojson';
    url += '&where=objectid=' + objectid;
    
    map.data.loadGeoJson(url);
  } else {
    console.error("Can't find all required property details so map won't be shown")
  }
  
}