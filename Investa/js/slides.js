/* Generate a unique slide for each Investa 3D building

This script iterates through each 3D building in the nominated web scene, and
generates a slide based on its complete set of floors.

The slide may then be adjusted in ArcGIS Online to finesse its position and orientation, etc.

Author: Stephen Lead
Date: April 2020

*/

var app = {
  buildingsLayer: null,
  propertyIDs: [],
  buildingExtents: {}
};

require([
  "esri/views/SceneView",
  "esri/tasks/support/Query",
  "esri/WebScene",
  "esri/core/watchUtils",
  "esri/geometry/support/webMercatorUtils",
  "esri/webscene/Slide",
  "esri/widgets/Home",
  "esri/geometry/geometryEngine",
  "esri/geometry/Extent"
  ], function(
  SceneView,
  Query,
  WebScene,
  watchUtils,
  webMercatorUtils,
  Slide,
  Home,
  geometryEngine,
  Extent
) {

  // For some reason webMercatorUtils isn't available in the fetchProperties function,
  // so bind it to the global object
  app.webMercatorUtils = webMercatorUtils;

  app.scene = new WebScene({
    portalItem: {
      id: config.webMapID
    }
  });

  app.view = new SceneView({
    map: app.scene,
    container: "viewDiv",
    padding: {
      top: 40
    },
    highlightOptions: {
      color: "#2DCCD3",
      fillOpacity: 0.8
    }
  });

  var homeWidget = new Home({
      view: app.view
    });
  app.view.ui.add(homeWidget, "top-left");

  app.view.when(function() {
    app.camera = app.view.camera.clone();
    app.camera.tilt = 45;

    app.slides = app.scene.presentation.slides;
    app.slides.forEach(createSlideUI);

    // Get a handle on the buildings layer
    for (var i = 0; i < app.scene.layers.items.length; i++) {
      var layer = app.scene.layers.items[i];
      if (layer.title !== undefined) {
        if (layer.title === config.buildingsLayerTitle){
          app.buildingsLayer = layer;

          // Iterate through each floor and build up the combined extent of the whole building
          var query = app.buildingsLayer.createQuery();
          query.outFields = ['BuildingName', 'PropertyID'];
          query.returnGeometry = true;
          app.buildingsLayer.queryFeatures(query).then(function(floors){
            $( floors.features ).each(function( index, floor ) {
              var propertyID = floor.attributes.PropertyID;
              if (!app.propertyIDs.includes(propertyID)) {
                app.propertyIDs.push(propertyID);
              }
              var extent = floor.geometry.extent.expand(1.5);
              if (app.buildingExtents[propertyID] === undefined) {
                app.buildingExtents[propertyID] = extent;
              } else {
                app.buildingExtents[propertyID] = app.buildingExtents[propertyID].union(extent);
              }
            });

            // Create a slide from each building's extent
            if (app.propertyIDs.length > 0) {
              app.view.camera = app.camera;
              createSlide();
            }

          });

        }
      }
    }

    if (app.buildingsLayer === null) {
      console.error("Can't find the buildings layer");
    }

  });

  $("#btnSave").on("click", function(evt){
    app.scene.updateFrom(app.view);
    app.scene.save();
  });

  function createSlide(){
    // Zoom to each building's extent and create a slide from it (if one doesn't already exist)
    var propertyID = app.propertyIDs[0];
    var slideExists = false;
    for (var i = 0; i < app.slides.items.length; i++){
      var slide = app.slides.items[i];
      var title = slide.title.text;
      if (parseInt(title) === propertyID) {
        slideExists = true;
        break;
      }
    }

    if (!slideExists){
      console.log("Creating a slide for building:", propertyID);
      var extent = app.buildingExtents[propertyID];
      app.view.extent = extent;
      Slide.createFrom(app.view).then(function(slide) {
        slide.title.text = app.propertyIDs[0];
        app.scene.presentation.slides.add(slide);
        createSlideUI(slide, "first");
        app.propertyIDs.shift();
        if (app.propertyIDs.length > 0) {createSlide();}
      });
    } else {
      console.log("a slide already exists for building", propertyID);
      app.propertyIDs.shift();
      if (app.propertyIDs.length > 0) {createSlide();}
    }

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
    });
  }

});
