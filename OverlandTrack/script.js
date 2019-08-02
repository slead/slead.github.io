var app = {
  // 20190802 - HS - changed start date
  startDate: '2019-08-01',
  graphics: []
};

require([
  "esri/Map",
  "esri/WebScene",
  "esri/webscene/Slide",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/widgets/BasemapToggle",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/PopupTemplate",
  "esri/widgets/Home",
  "esri/renderers/ClassBreaksRenderer"
], function(Map, WebScene, Slide, SceneView, SceneLayer, BasemapToggle, FeatureLayer, Graphic, PopupTemplate, Home, ClassBreaksRenderer) {

  // Configure the connection to the SPOT server
  var data = {
    'license': null,
    'expiryDate': null,
    'feedPassword': 'password',
    // 20190802 - HS - added parameters to show all points on hike, not just the default of 51 most recent points
    'start': 0,
    'limit' : 500
  }

  // Call the server every 5 minutes
  app.timer = setInterval(fetchGPS, 300000);

  app.scene = new WebScene({
    portalItem: { // autocasts as new PortalItem()
      id: "3d23afef08a841d2b6b86c44e1cc5483"  // ID of the WebScene on arcgis.com
    }
  });

  // Create the SceneView
  app.view = new SceneView({
    container: "viewDiv",
    map: app.scene,
    center: [146.633,-42.103],
    zoom: 6
  });

    app.view.when(function() {
      $("#slidesDiv").fadeIn('slow');
      var slides = app.scene.presentation.slides;
      slides.forEach(createSlideUI);

      // Try to navigate to the first slide
      try{
        setTimeout(function(){
          app.scene.presentation.slides.items[0].applyTo(app.view);
          fetchGPS();
        }, 3000);
      } catch(err){
        console.log("Error navigating to the first slide");
      }

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

  app.gpsRenderer = {
    type: "class-breaks",
    field: "hours",
    defaultSymbol: {
      type: "simple-marker",
      style: "circle",
      color: "#727272",
      size: "18px",
      outline: {
        color: "#e9e9e9",
        width: 1
      }
    },
    defaultLabel: "no data",
    classBreakInfos: [
      {
        minValue: 0,
        maxValue: 1,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "#FF2000",
          size: "18px",
          outline: {
            color: "#e9e9e9",
            width: 1
          }
        }
      },
      {
        minValue: 1.001,
        maxValue: 4,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "#FF4000",
          size: "16px",
          outline: {
            color: "#e9e9e9",
            width: 1
          }
        }
      },
      {
        minValue: 4.001,
        maxValue: 24,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "#FF5000",
          size: "14px",
          outline: {
            color: "#e9e9e9",
            width: 1
          }
        }
      },
      {
        minValue: 24.001,
        maxValue: 36,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "#FF7000",
          size: "12px",
          outline: {
            color: "#e9e9e9",
            width: 1
          }
        }
      },
      {
        minValue: 36.001,
        maxValue: 99999999999,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: "#FF8B00",
          size: "10px",
          outline: {
            color: "#e9e9e9",
            width: 1
          }
        }
      }
    ]
  };

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

      // Clear the existing graphics
      app.graphics = [];

      var messages = results.response.feedMessageResponse.messages.message;
      for (var i=0; i < messages.length; i++){
        var message = messages[i];

        // Remove any points prior to the starting date
        var dateTime = moment(message.dateTime).format('YYYY-MM-DD');
        if (dateTime >= app.startDate) {

          var latitude = message.latitude;
          var longitude = message.longitude;
          var timestamp = moment(message.dateTime).format('D MMMM YYYY, h:mm:ss a');
          var day = moment(message.dateTime).format('dddd');

          // Calculate the age of this point so we can symbolise it
          var now = moment(new Date()); //todays date
          var duration = moment.duration(now.diff(timestamp));
          var hours = duration.asHours();
          var age;
          if (hours > 24) {
            age = Math.round(duration.asDays()) + " days ago";
          } else if (hours < 1) {
            age = Math.round(duration.asMinutes()) + " minutes ago";
          } else {
            age = Math.round(duration.asHours())  + " hours ago"
          }

          var point = {
            type: "point",
            x: longitude,
            y: latitude
          };

          var pointGraphic = new Graphic({
            geometry: point,
            // symbol: app.objectSymbol,
            attributes: {
              "timestamp": timestamp,
              "latitude": latitude,
              "longitude": longitude,
              "hours": hours,
              "age": age,
              "day": day
            }
          });
          app.graphics.push(pointGraphic);
        }

      }

      var popupTemplate = {
        title: "{day} {timestamp} ({age})",
        content: "Position: {latitude},{longitude}"
      }

      // Build the GPS points layer
      try{
        app.scene.remove(app.gpsLayer);
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
          {name: "hours", type: "double"},
          {name: "age", type: "string"},
          {name: "day", type: "string"}
        ],
        id: 'GPSlayer',
        objectIdField: "ObjectID",
        geometryType: "point",
        spatialReference: { wkid: 4326 },
        source: app.graphics,
        popupTemplate: popupTemplate,
        renderer: app.gpsRenderer
      });
      app.scene.add(app.gpsLayer);

    } catch(error){
      handleError(error);
    }
  }

  function handleError(error) {
    console.log("Error: ", error)
  }

  function createSlideUI(slide, placement) {
    var slideElement = document.createElement("div");
    slideElement.id = slide.id;
    slideElement.classList.add("slide");

    var slidesDiv = document.getElementById("slidesDiv");
    if (placement === "first") {
      slidesDiv.insertBefore(slideElement, slidesDiv.firstChild);
    } else {
      slidesDiv.appendChild(slideElement);
    }

    var title = document.createElement("div");
    title.innerText = slide.title.text;
    slideElement.appendChild(title);

    var img = new Image();
    img.src = slide.thumbnail.url;
    img.title = slide.title.text;
    slideElement.appendChild(img);

    slideElement.addEventListener("click", function() {
      var slides = document.querySelectorAll(".slide");
      Array.from(slides).forEach(function(node) {
        node.classList.remove("active");
      });

      slideElement.classList.add("active");

      slide.applyTo(app.view);
      fetchGPS();
    });
  }

});
