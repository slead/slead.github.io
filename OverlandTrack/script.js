var app = {};

require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/PopupTemplate"
], function(Map, SceneView, SceneLayer, GeoJSONLayer, BasemapToggle, GraphicsLayer, Graphic, PopupTemplate) {

  var data = {
    'license': null,
    'expiryDate': null,
    'feedPassword': 'password'
  }

  $.ajax({
    type: "GET",
    data: data,
    url: "https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/16eXyDLztlnvBYOYclTKcyfLas4rM2pvI/message"
  })
    .done(handleResults)
    .catch(handleError);

  // Create Map
  app.map = new Map({
    basemap: "topo",
    ground: "world-elevation"
  });

  // Create the SceneView
  app.view = new SceneView({
    container: "viewDiv",
    map: app.map,
    center: [146.633,-42.103],
    zoom: 6
  });

  // Basemap toggle
  var toggle = new BasemapToggle({
    view: app.view,
    nextBasemap: "satellite"
  });
  app.view.ui.add(toggle, "top-right");

  // Overland track route
  app.RouteLayer = new GeoJSONLayer({
     url: "./Overland-Track/tracks.geojson",
     geometryType: 'polyline'
  });
  app.map.add(app.RouteLayer);

  // Huts
  var hutLabels = {
    // autocasts as new LabelClass()
    symbol: {
      type: "text",  // autocasts as new TextSymbol()
      color: "green",
      haloColor: "black",
      font: {  // autocast as new Font()
        family: "Playfair Display",
        size: 12,
        weight: "bold"
      }
    },
    labelPlacement: "above-center",
    labelExpressionInfo: {
      expression: "$feature.name"
    }
  };

  app.HutsLayer = new GeoJSONLayer({
     url: "./Overland-Track/huts.geojson",
     geometryType: 'point',
     labelingInfo: [hutLabels]
  });
  app.map.add(app.HutsLayer);

  app.RouteLayer.when(function() {
    zoomToLayer(app.RouteLayer);
  });

  // Create objectSymbol and add to renderer
  app.objectSymbol = {
    type: "point-3d", // autocasts as new PointSymbol3D()
    symbolLayers: [
      {
        type: "object", // autocasts as new ObjectSymbol3DLayer()
        width: 250,
        height: 250,
        resource: {
          primitive: "sphere"
        },
        material: {
          color: "#FFD700"
        }
      }
    ]
  };

  app.popupTemplate = {
    // autocasts as new PopupTemplate()
    title: "Population in {NAME}",
    content: "{latitude} {longitude}"
  }

  app.graphicsLayer = new GraphicsLayer({
    opacity: 0.5
  });
  app.map.add(app.graphicsLayer);

  function zoomToLayer(layer) {
    return layer.queryExtent().then(function(response) {
      app.view.goTo(response.extent);
    });
  }

  function handleResults(results){
    try {

      var messages = results.response.feedMessageResponse.messages.message;
      for (var i=0; i < messages.length; i++){
        var message = messages[i];
        var latitude = message.latitude;
        var longitude = message.longitude;
        var timestamp = message.dateTime;
        console.log(latitude, longitude, timestamp);
        var point = {
          type: "point", // autocasts as new Point()
          x: longitude,
          y: latitude
        };

        var pointGraphic = new Graphic({
          geometry: point,
          symbol: app.objectSymbol,
          popupTemplate: app.popupTemplate
        });

        app.graphicsLayer.add(pointGraphic);
      }

    } catch(error){
      handleError(error);
    }
  }

  function handleError(error) {
    console.log("Error: ", error)
  }

});
