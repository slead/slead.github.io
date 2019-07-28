var app = {
  startDate: '2019-07-28',
  graphics: []
};

require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/PopupTemplate",
  "esri/widgets/Home"
], function(Map, SceneView, SceneLayer, GeoJSONLayer, BasemapToggle, FeatureLayer, Graphic, PopupTemplate, Home) {

  // Configure the connection to the SPOT server
  var data = {
    'license': null,
    'expiryDate': null,
    'feedPassword': 'password'
  }

  // Call the server every 5 minutes
  fetchGPS();
  app.timer = setInterval(fetchGPS, 15000);

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

  app.homeWidget = new Home({
    view: app.view
  });
  app.view.ui.add(app.homeWidget, "top-left");

  // Basemap toggle
  var toggle = new BasemapToggle({
    view: app.view,
    nextBasemap: "satellite"
  });
  app.view.ui.add(toggle, "top-right");

  // Overland track route
  app.RouteLayer = new GeoJSONLayer({
     url: "./Overland-Track/tracks.geojson",
     geometryType: 'polyline',
     id: "routes"
  });
  app.map.add(app.RouteLayer);

  // Huts
  var hutLabels = {
    symbol: {
      type: "text",
      color: "#727272",
      haloColor: "black",
      font: {
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
     labelingInfo: [hutLabels],
     id: 'huts'
  });
  app.map.add(app.HutsLayer);

  app.RouteLayer.when(function() {
    //zoomToLayer(app.RouteLayer);
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

  function zoomToLayer(layer) {
    return layer.queryExtent().then(function(response) {
      app.view.goTo(response.extent);
    });
  }

  function fetchGPS(){
    console.log("fetch GPS points");

    $.ajax({
      type: "GET",
      data: data,
      url: "https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/16eXyDLztlnvBYOYclTKcyfLas4rM2pvI/message"
    })
      .done(handleResults)
      .catch(handleError);

  }

  function handleResults(results){
    // Create an array of graphics from the GPS points, and use that to build a feature layer
    try {

      var messages = results.response.feedMessageResponse.messages.message;
      for (var i=0; i < messages.length; i++){
        var message = messages[i];

        // Remove any points prior to the starting date
        var dateTime = moment(message.dateTime).format('YYYY-MM-DD');
        if (dateTime >= app.startDate) {

          var latitude = message.latitude;
          var longitude = message.longitude;
          var timestamp = moment(message.dateTime).format('D MMMM YYYY, h:mm:ss a');

          var point = {
            type: "point",
            x: longitude,
            y: latitude
          };

          var pointGraphic = new Graphic({
            geometry: point,
            symbol: app.objectSymbol,
            attributes: {
              "timestamp": timestamp,
              "latitude": latitude,
              "longitude": longitude
            }
          });
          app.graphics.push(pointGraphic);
        }

      }

      var popupTemplate = {
        title: "Recorded at {timestamp}",
        content: "Position: {latitude},{longitude}"
      }

      var gpsRenderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          size: 8,
          //color: [0, 255, 255],
          color: "#0000A0",
          outline: null
        }
      };

      // Build the GPS points layer
      try{
        app.map.remove(app.gpsLayer);
        var blah = 0;
      } catch(err) {
        console.log("unable to remove GPS layer")
      }
      app.gpsLayer = new FeatureLayer({
        fields: [
          {name: "ObjectID", type: "oid"},
          {name: "timestamp", type: "string"},
          {name: "dateTime", type: "date"},
          {name: "latitude", type: "double"},
          {name: "longitude", type: "double"},
        ],
        id: 'GPSlayer',
        objectIdField: "ObjectID",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        source: app.graphics,
        popupTemplate: popupTemplate,
        renderer: gpsRenderer
      });
      app.map.add(app.gpsLayer);


    } catch(error){
      handleError(error);
    }
  }

  function handleError(error) {
    console.log("Error: ", error)
  }

});
