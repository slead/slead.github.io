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
    },
    availableFloors: null
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
    app.homeWidget.viewpoint = new Viewpoint({camera: app.view.camera});

    // TODO: highlight the relevant row when hovering over the floor on the map

    // Get a handle on the buildings layers, and adjust their query/visibility
    for (var i = 0; i < app.scene.layers.items.length; i++) {
      var layer = app.scene.layers.items[i];
      if (layer.title !== undefined) {
        if (layer.title === config.buildingsLayerTitle){
          app.buildingsLayer = layer;
          app.buildingsLayer.visible = true;
          app.buildingsLayer.popupEnabled = false;

          // Filter the buildings layer to show only the target property
          app.view.whenLayerView(app.buildingsLayer).then(function(layerView){
            console.log("filtering buildings layer")
            app.buildingsLayerView = layerView;
            app.buildingsLayerView.visible = true;
            app.buildingsLayerView.layer.definitionExpression = config.propertyIdField + '=' + parseInt(app.propertyID);

            // Highlight the relevant floor when hovering over it in the Availability table
            $(".property-floor-row").hover(function(evt){
              try{
                var floor = $(this).find(".first").data('floor');
                console.log("highlight floor", floor);
                if (app.highlight) {app.highlight.remove();}
                var query = app.buildingsLayer.createQuery();
                query.where = "PropertyID =" + app.propertyID + " and Floor='F" + floor + "'";
                query.outFields = ["*"];
                app.buildingsLayer.queryFeatures(query).then(function(result){
                  if (app.highlight) {app.highlight.remove();}
                  app.highlight = app.buildingsLayerView.highlight(result.features);
                });
              } catch(err) {
                console.error("There was a problem highlighting the floor")
              }
            }, function() {
              console.log("remove highlight")
              if (app.highlight) {app.highlight.remove();}
              if (app.availableFloors !== null) {
                app.highlight = app.buildingsLayerView.highlight(app.availableFloors);
              }
            });

            // Pre-highlight all of the available floors when the page loads
            var query = app.buildingsLayer.createQuery();
            query.where = "PropertyID =" + app.propertyID + " AND (";

            var floorWhere;
            var rows = $('.property-floor-row');
            for (var r=0; r < rows.length; r++){
              var row = rows[r];
              var floor = $($(row).find('.first')[0]).data('floor');
              if (floorWhere === undefined) {
                floorWhere = "Floor = 'F" + floor + "'";
              } else {
                floorWhere += " OR Floor = 'F" + floor + "'";
              }
            }
            if (floorWhere !== undefined){
              query.where += floorWhere + ")"
              query.outFields = ["*"];
              app.buildingsLayer.queryFeatures(query).then(function(result){
                app.availableFloors = result.features;
                if (app.highlight) {app.highlight.remove();}
                app.highlight = app.buildingsLayerView.highlight(app.availableFloors);
              });
            }

            // Listen for a hover event on the building, and highlight the relevant table row
            app.view.on("pointer-move", function(event) {

              // Remove any existing highlights
              $('.property-floor-row').removeClass('active')

              app.view.hitTest(event).then(function(response) {
                var result = response.results[0];

                // Check whether the point is over a target building
                if (result && result.graphic && result.graphic.layer.title === config.buildingsLayerTitle) {
                  var oid = result.graphic.attributes['OBJECTID'];
                  if (oid !== undefined){
                    var query = app.buildingsLayer.createQuery();
                    query.where = "OBJECTID=" + oid;
                    query.outFields = ["*"];

                    // Find the floor value for this feature, and highlight the floor
                    app.buildingsLayer.queryFeatures(query).then(function(result){

                      try{
                        // Also highlight the matching table row for this floor. This will be the
                        // row element, two levels up from the span holding the floor data attrbute
                        var floor = parseInt(result.features[0].attributes['Floor'].replace("F",""));
                        if ($('span[data-floor="' + floor + '"]')[0] !== undefined){
                          $('span[data-floor="' + floor + '"]').parent().parent().addClass('active');
                        }
                      } catch(err) {
                        console.error("There was a problem highlighting the floor in the table")
                      }
                    });
                  }
                } else {
                  // highlight the available floors
                  if (app.availableFloors !== null) {
                    if (app.highlight) {app.highlight.remove();}
                    app.highlight = app.buildingsLayerView.highlight(app.availableFloors);
                  }
                }
              });
            });

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
