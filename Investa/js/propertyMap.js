/* This code mocks up the integration of the 3D map into the individual building's
page (eg https://www.investa.com.au/properties/135-king-street)

The property ID must be provided on the HTML page in the hidden textinput field:
$(".PropertyIDHidden input").val()

This code finds the slide coresponding to that property, which was previously generated
using the slides.html page, and applies it to the view. The contextual buildings layer
is hidden, and the 3D buildings layer is filtered to show only the target building.

Author: Stephen Lead
Date: April 2020

*/

var app = {
};

require([
  "esri/views/SceneView",
  "esri/WebScene",
  "esri/webscene/Slide",
  "esri/widgets/Home",
  "esri/Viewpoint"
  ], function(
  SceneView,
  WebScene,
  Slide,
  Home,
  Viewpoint
) {

  if ($(".PropertyIDHidden input").val() === undefined) {
    console.error("property ID not found");
    return;
  } else {
    app.propertyID = $(".PropertyIDHidden input").val() ;
    console.log("Opening property", app.propertyID)
  }

  app.scene = new WebScene({
    portalItem: {
      id: config.webMapID
    },
    viewingMode: 'local'
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

  // Remove unnecessary controls, add home control
  app.view.ui.components = [ "zoom", 'attribution' ];
  app.homeWidget = new Home({
    view: app.view
  });
  app.view.ui.add(app.homeWidget, "top-left");

  // Iterate through the slides to find the one matching the property ID
  app.view.when(function() {
    app.slides = app.scene.presentation.slides;

    for (var i = 0; i < app.slides.items.length; i++){
      var slide = app.slides.items[i];
      if (slide.title.text === app.propertyID) {
        console.log("Applying slide", slide.title.text);
        buildStackingPlan(slide);
        break;
      }
    }
  });

  function buildStackingPlan(slide) {
    // Zoom to this slide, and set its extent as the Home button's default extent
    slide.applyTo(app.view, {animate: false});
    app.homeWidget.viewpoint = new Viewpoint({camera: app.view.camera})

    // Get a handle on the buildings layers, and adjust their query/visibility
    for (var i = 0; i < app.scene.layers.items.length; i++) {
      var layer = app.scene.layers.items[i];
      if (layer.title !== undefined) {
        if (layer.title === config.buildingsLayerTitle){
          app.buildingsLayer = layer;
          app.view.whenLayerView(app.buildingsLayer).then(function(layerView){
            console.log("filtering buildings layer")
            layerView.layer.definitionExpression = config.propertyIdField + '=' + parseInt(app.propertyID);
          });

        } else if (layer.title === config.contextualBuildingsLayerTitle) {
          app.contextualBuildingsLayer = layer;
          app.view.whenLayerView(app.contextualBuildingsLayer).then(function(layerView){
            console.log("hiding contextual buildings layer")
            layerView.visible = false;
          });
        } else if (layer.title === config.pointLayerTitle) {
          app.citiesLayer = layer;
          app.view.whenLayerView(app.citiesLayer).then(function(layerView){
            console.log("hiding cities layer")
            layerView.visible = false;
          });
        }
      }
    }
  }
})
