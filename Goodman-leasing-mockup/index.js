let map;
let propertyUrl = 'https://smartspace.goodman.com/arcgis/rest/services/PropertyBoundariesTemplate/FeatureServer/0';
let enrichUrl = 'https://smartspace.goodman.com/arcgis/rest/services/Hosted/Leasing_enriched_drivetimes/FeatureServer/0';

function initMap() {

  // retrieve the lat/long/zoom from the data-elements
  let latitude = $("#title").data('latitude');
  let longitude = $("#title").data('longitude')
  let zoom = $("#title").data('zoom') || 15;
  let objectid = $("#title").data('objectid');
  let name = $("#title").data('name');

  if (latitude && longitude && objectid){
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: latitude, lng: longitude },
      zoom: zoom,
    });

    // Fetch the GeoJSON representation of the property and load it into the map
    let url = propertyUrl + '/query?outFields=*&returnGeometry=true&f=geojson';
    // url += '&where=objectid=' + objectid;
    url += "&where=name=%27" + name.replaceAll(" ", "%20") + "%27";
    map.data.loadGeoJson(url);
  } else {
    console.error("Can't find all required property details so map won't be shown")
  }
  
}