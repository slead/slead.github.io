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

var map = new L.Map("map", {
  center: center,
  zoom: zoom,
  layers: [basemap],
  zoomControl: false,
  attributionControl: false
});

var properties = L.esri.featureLayer({
  url: "https://services1.arcgis.com/XBDCraMz4XwnRrFo/arcgis/rest/services/SHI_Properties/FeatureServer/0",
  style: function () {
    return { color: "#70ca49", weight: 2 };
  }
}).addTo(map);
