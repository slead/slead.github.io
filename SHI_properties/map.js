var center = [12.2, -84.9];
var zoom = 6;

var tileOptions = {
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png',
  opacity: 0.5
};
var basemap = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', tileOptions);
var zoomControl = true;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
 zoomControl = false;
};
var map = new L.Map("map", {
  center: center,
  zoom: zoom,
  maxZoom: 13,
  layers: [basemap],
  zoomControl: zoomControl,
  attributionControl: true
});

var properties = L.esri.Cluster.featureLayer({
  url: "https://services1.arcgis.com/XBDCraMz4XwnRrFo/arcgis/rest/services/SHI_Properties/FeatureServer/0",
  onEachFeature: function onEachFeature(feature, layer) {
    var properties = feature.properties;
    var popupContent = "<strong>" + properties.FirstName + " (" + properties.FirstName + " " + properties.LastName + ")";
    layer.bindPopup(popupContent);
  }
}).addTo(map);
