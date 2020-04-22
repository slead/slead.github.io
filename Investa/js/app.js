var app = {
  citiesLayer: null,
  buildingsLayer: null,
  propExtents: null,
  activePropertyID: null
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

    // Load the web scene's slides
    app.slides = app.scene.presentation.slides;

    // Get a handle on the cities layer
    for (var i = 0; i < app.scene.layers.items.length; i++) {
      var layer = app.scene.layers.items[i];
      if (layer.title !== undefined) {
        if (layer.title === config.pointLayerTitle) {
          app.citiesLayer = layer;

          // Listen for a click on the cities layer, and zoom to the equivalent slide
          app.viewClickListener = app.view.on("click", function(event) {

            // Remove the active class from the sidebar. In the Angular app this may not be necessary
            $( ".sidebar-list-item" ).removeClass("active");

            viewClick(event);
          });

        } else if (layer.title === config.buildingsLayerTitle){
          app.buildingsLayer = layer;

          app.highlight;
          app.view.whenLayerView(app.buildingsLayer).then(function(layerView){
           app.layerView = layerView;
          });
        }
      }
    }

    if (app.citiesLayer === null) {
      console.error("Can't find the cities layer");
      return;
    }

    if (app.buildingsLayer === null) {
      console.error("Can't find the buildings layer");
      return;
    }

    // Check for any applicable URL parameters, and run a search now if they exist
    if (window.location.search !== '') {
      filterProperties();
    } else {
      fetchProperties();
    }

  });

  // Update the property list when the view stops updating
  watchUtils.whenTrue(app.view, "stationary", function(evt) {
    try{

      // Convert the view extent into the lat/long bounding coords. Expand it slightly
      var extent = app.view.extent.expand(1.2)
      var xmin = extent.xmin;;
      var ymin = extent.ymin;
      var xmax = extent.xmax;
      var ymax = extent.ymax;

      var SouthWestLng = app.webMercatorUtils.xyToLngLat(xmin, ymin)[0];
      var SouthWestLat = app.webMercatorUtils.xyToLngLat(xmin, ymin)[1];
      var NorthEastLng = app.webMercatorUtils.xyToLngLat(xmax, ymax)[0];
      var NorthEastLat = app.webMercatorUtils.xyToLngLat(xmax, ymax)[1];

      // Clear the hightlights
      if (app.highlight) {
        app.highlight.remove();
      }

      fetchProperties(SouthWestLng, SouthWestLat, NorthEastLng, NorthEastLat);
    } catch(err) {
      // console.error("There was a problem fetching the buildings", err)
    }
  });

  function viewClick(event) {
    // When the user clicks on the view, if they clicked:
    // - on a capital city, open its matching slide
    // - on a 3D building, open its sidebar panel

    app.view.hitTest(event).then(function (response) {
      try{

        // Determine whether a layer was found here
        var results = response.results;
        if (results.length > 0){

          // Only use the first result. Visible scale thresholds are used to ensure that the
          // cities and 3D buildings layers don't show at the same time, so only one or the
          // other will ever be visible. This avoids iterating over multiple floors of the same building
          var result = results[0];

          if (result.graphic.sourceLayer.title === config.pointLayerTitle) {
            // User clicked on a city, so zoom to it
            try{
              var city = result.graphic.attributes['Name'];

              // Find the equivalent slide
              var slide = app.slides.find(function(slide){
                return slide.title.text === city;
              });
              console.log("Zooming to", slide.title.text);
              slide.applyTo(app.view);
            } catch (error) {
              console.error("There was a problem zooming to this slide")
            }

          } else if (result.graphic.sourceLayer.title === config.buildingsLayerTitle) {
            // User clicked on an Investa building, so open its sidebar entry
            console.log("clicked on a 3D building");

            // Fetch the property ID from the layer associated with the 3D layer
            var layer = result.graphic.layer.associatedLayer;
            var query = new Query({
              returnGeometry: false,
              where: "OBJECTiD = " + result.graphic.attributes.OBJECTID,
              outFields: "*"
            });
            layer.queryFeatures(query).then(function(results){
              try{
                app.activePropertyID = results.features[0].attributes[config.propertyIdField];

                // In this example, make the sidebar entry active. In the Angular app, we may
                // need to trigger a click on the sidebar entry
                $( ".sidebar-list-item" ).removeClass("active");
                $('*[data-propertyid="' + app.activePropertyID + '"]').addClass("active");
                console.log("highlight propertyID", app.activePropertyID);
              } catch (error) {
                console.error("There was a problem highlighting this property in the sidebar");
              }
            }).catch(function(error){
              console.error("There was a problem querying the layer");
            });
          }
        }
      } catch (error) {
        console.error("There was a problem with the click function")
      }

    });
  }

  function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
  };

  function fetchProperties(SouthWestLng, SouthWestLat, NorthEastLng, NorthEastLat) {
    // Retrieve the list of properties from the Investa search URL, within the current map extent

    var data = {
      "NorthEastLat": NorthEastLat,
      "NorthEastLng": NorthEastLng,
      "SouthWestLat": SouthWestLat,
      "SouthWestLng": SouthWestLng
    };

    $.ajax({
      url: config.searchUrl,
      data: $.param(data),
      type: 'POST'
    }).done(function(response) {
      // Once the buildings are returned from the Investa server, display them in the sidebar.
      handleQueryResults(response);
    }).catch(function(error) {
      //console.error("There was a problem")
    });
  }

  function filterProperties() {
    // Retrieve the list of properties from the Investa search URL, based on the specified URL parameters
    var dict = {
      minspace: 'sqmMin',
      maxspace: 'sqmMax',
      locations: 'locations'
    }

    var data = {};
    for (var key in dict){
      if (getUrlParameter(key) !== undefined) {
        data[dict[key]] = getUrlParameter(key)
      }
    }

    $.ajax({
      url: config.searchUrl,
      data: $.param(data),
      type: 'POST',
      beforeSend: function (jqXHR) {
        // The URL parameters may have been unusable, so don't zoom to them in that case
        jqXHR.zoomToResults = !jQuery.isEmptyObject(data);
      },
    }).done(function(response, status, jqXHR) {
      // Once the buildings are returned from the Investa server, display them in the
      // sidebar and zoom to their combined extent
      handleQueryResults(response, jqXHR.zoomToResults);
    }).catch(function(error) {
      //console.error("There was a problem")
    });
  }

  function handleQueryResults(properties, zoomToResults){
    // Once the buildings are returned from the Investa server, display them in the sidebar
    $("#propertiesList").empty();
    app.propExtents = null;

    $.each(properties, function(i, property){
      // add each property to the sidebar. In the app this will be handled by Angular so this is just a temp mockup
      var propertyID = property[config.propertyIdField];
      var latitude = property.Latitude;
      var longitude = property.Longitude;
      var extent = new Extent({
        xmin: longitude - 0.001,
        xmax: longitude + 0.001,
        ymin: latitude - 0.001,
        ymax: latitude + 0.001
      });
      extent = app.webMercatorUtils.geographicToWebMercator(extent);

      if (app.propExtents === null) {
        app.propExtents = extent;
      } else {
        // union the extents to create the combined extent
        app.propExtents = app.propExtents.union(extent);
      }

      // Highlight the active building. In the Angular app, this may require another approach
      var classes = "sidebar-list-item";
      if (propertyID === app.activePropertyID){
        classes += " active";
      }

      var html = '<div class="' + classes + '" data-propertyid="' + propertyID + '">'
      if (property.MapImage !== undefined && property.MapImage !== null) {
        html += '<div class="list-image col-md-4 col-sm-4 col-xs-hidden">'
        html += '<div class="background-img" style="background-image: url(' + property.MapImage.replace("/WWW_Investa/", 'https://www.investa.com.au/www_investa/') + ')">'
        html += '<img src="' + property.MapImage.replace("/WWW_Investa/", 'https://www.investa.com.au/www_investa/') + '" class="dummy-img" alt="' + property.DocumentName + '"></div></div>'
      }
      html += '<div class="list-text col-md-8 col-sm-8 col-xs-12 data-ng-cloak">'
      html += '<h5 class="title ng-binding">' + property.DocumentName + '</h5>'
      html += '<div class="suburb ng-binding">' + property.Suburb + ' | ' + property.State + '</div></div>';
      html += '</div>';
      $("#propertiesList").append(html);

      // Highlight the available floors
      if (property.Offices !== undefined && property.Offices.length !== undefined) {
        for (var o = 0; o < property.Offices.length; o++){
          var office = property.Offices[o];
          if (office.Floors !== undefined && office.Floors !== undefined) {
            for (var f = 0; f < office.Floors.length; f++){
              var floor = office.Floors[f];
                console.log('highlight floor', floor['Name'], " in building ", property.PropertyID)

                var query = app.buildingsLayer.createQuery();
                query.where = "PropertyID =" + property.PropertyID + " and Floor='F" + floor['Name'] + "'";
                query.outFields = ["*"];
                app.buildingsLayer.queryFeatures(query).then(function(result){
                  app.highlight = app.layerView.highlight(result.features);
                })
            }
          }
        }
      }
    });

    if (zoomToResults) {
      app.view.extent = app.propExtents;
    }

    // When the user clicks on a sidebar item, zoom to the matching building
    $( ".sidebar-list-item" ).click(function(evt) {

      // Make the current item active. In Angular, perhaps we need to trigger a click on the item?
      $( ".sidebar-list-item" ).removeClass("active");
      $(this).addClass("active");

      // Zoom to the building with matching property ID
      app.activePropertyID = $(this).data('propertyid');
      console.log('zoom to', app.activePropertyID);
      var query = new Query({
        returnGeometry: true,
        where: config.propertyIdField + " = " + app.activePropertyID
      });

      // Query the buildings layer to find the geometries
      app.buildingsLayer.queryFeatures(query).then(function(results){
        if (results.features.length > 0) {

          // Union the floors together to find the total geometry, then zoom the view to it
          var geometries = $.map(results.features, function(feature) {
            return feature.geometry;
          });
          var union = geometryEngine.union(geometries);
          app.view.goTo({
            center: [union.centroid.longitude, union.centroid.latitude],
            heading: 0,
            zoom: 18,
            tilt: 45
          },
          {duration: 1000}
        );

        } else {
          console.error("Building not found");
        }
      }).catch(function(error){
        console.error("There was a problem zooming to the building");
      });
    });
  }

});
