var assetMap = {
  storeLayerUrl: "https://gisppd.stockland.com.au/server/rest/services/S4M_Stockland_CP_Retail/MapServer",
  center: [151.20967263728116, -33.82344902728818],
  zoom: 19,
  printUrl: "https://gisppd.stockland.com.au/server/rest/services/ConvertWebmapToPNG/GPServer/Convert%20webmap%20to%20PNG"
}

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/MapImageLayer",
  "esri/tasks/PrintTask",
  "esri/tasks/support/PrintParameters",
  "esri/tasks/support/PrintTemplate",
], function(Map, MapView, MapImageLayer, PrintTask, PrintParameters, PrintTemplate) {

  assetMap.storeLayer = new MapImageLayer({
    url: assetMap.storeLayerUrl,
    // sublayers: assetMap.sublayers
  });

  assetMap.map = new Map({
    basemap: "gray-vector",
    layers: [assetMap.storeLayer]
  });

  assetMap.view = new MapView({
    container: "viewDiv",
    map: assetMap.map,
    center: assetMap.center,
    zoom: assetMap.zoom
  });

  assetMap.printTask = new PrintTask({
    url: assetMap.printUrl,
    // mode: "async"
  });


  $("#doBtn").on("click", function(evt){
    $("#printWindow").toggle();
  })

  $('#printWindow').draggable();

});
