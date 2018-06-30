var center = [12.2, -84.9];
// center = [15.190292861412557, -87.38691151142122]
var zoom = 6;

var tileOptions = {
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png',
  opacity: 0.5
};
var basemap = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', tileOptions);

var streetmap =  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2xlYWQiLCJhIjoiMzJtWVZPRSJ9.HawMu0wrhpGi1PGpqbzbMg', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets',
    opacity: 0.5
  });

var zoomControl = true;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
 zoomControl = false;
};
var map = new L.Map("map", {
  center: center,
  zoom: zoom,
  maxZoom: 13,
  layers: [streetmap],
  zoomControl: zoomControl,
  attributionControl: true
});

var geojsonMarkerOptions = {
  radius: 8,
  fillColor: "#ed752f",
  color: "#95d6d5",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

var properties = L.esri.Cluster.featureLayer({
  url: "https://services1.arcgis.com/XBDCraMz4XwnRrFo/arcgis/rest/services/SHI_Properties/FeatureServer/0",
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, geojsonMarkerOptions);
  },
  onEachFeature: function onEachFeature(feature, layer) {
    var properties = feature.properties;
    var popupContent = "<h4>" + properties.Name + "</h4>";
    popupContent += "<table id='tblProperties'><tbody>";
    popupContent += "<tr><td>Farmer:</td><td>" + properties.FirstName + " " + properties.LastName + "</td></tr>";
    popupContent += "<tr><td>Phase:</td><td>" + properties.Phase + "</td></tr>";
    popupContent += "<tr><td>Trainer:</td><td>" + properties.FieldTrainer + "</td></tr>";
    popupContent += "<tr><td>Area:</td><td>" + properties.Area + " " + properties.Units + "</td></tr>";
    if (properties.Products !== 'N/A'){
      popupContent += "<tr><td>Products:</td><td>" + properties.Products + "</td></tr>";
    }
    popupContent += "</tbody></table>"
    layer.bindPopup(popupContent);
  }
}).addTo(map);
