let gmap, esrimap, latitude, longitude, propertyid, zoom, propertyName;

// Publicly-accessible property boundary layer
let propertyUrl = 'https://smartspace.goodman.com/arcgis/rest/services/PropertyBoundariesTemplate/FeatureServer/0';

// Layer holding the drivetime + enrichment results. This is currently private so requires a token, but will need to be publicly-accessible
let enrichUrl = 'https://smartspace.goodman.com/arcgis/rest/services/Hosted/Leasing_enriched_drivetimes/FeatureServer/0';

// TODO: A token is required until the layer is made publicly-accessible
let token = 'rQqU52eE3CXxIznkRKgQLwEXdCD-CGBoL9j1VitT95VEJxL5YJTM_68oGbP2JpQ5ehqJdTahk6cQOpbUVCS_FqIJMEEnryw7y2pin0ovWv8SlvrYn47BPyAhtsYbp0YIZ6LwnqB444UoXyBgKTwPPSxtIBW1EznaM1BAsJUCdntq14bMg6VEP7z_0TMCM5ezLnGq47zWjHGpY7QJOHkXGY6XvQ3nZp-S3xZT8iTTmpM.'
enrichUrl += "?token=" + token;

function initMap() {

  require([
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query"
  ], function(QueryTask, Query) {

    // retrieve the lat/long/zoom, property id and propertyName from the data-elements on the DOM
    latitude = $("#title").data('latitude');
    longitude = $("#title").data('longitude')
    zoom = $("#title").data('zoom') || 15;
    objectid = $("#title").data('objectid');
    propertyid = $("#title").data('propertyid');
    propertyName = $("#title").data('propertyname');

    if (latitude && longitude && objectid && propertyid && propertyName){
      gmap = new google.maps.Map(document.getElementById("gmap"), {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
      });

      gmap.data.setStyle({
        fillColor: "#77AD1C",
        fillOpacity: 0.8,
        strokeWeight: 0
      });

      // Fetch the GeoJSON representation of the property and load it into the map
      propertyUrl += '/query?outFields=*&returnGeometry=true&f=geojson';

      // Create a where clause using the applicable query (objectid, propertyid, or propertyName)
      propertyUrl += "&where=name=%27" + propertyName.replaceAll(" ", "%20") + "%27";
      // propertyUrl += '&where=objectid=' + objectid;
      // propertyUrl += "&where=propertyid=%27" + propertyid + "%27";

      // Use this propertyUrl to load the GeoJSON
      gmap.data.loadGeoJson(propertyUrl);
    } else {
      console.error("Can't find all required property details so map won't be shown")
    }

    if (propertyid){
      // Fetch the enriched data using an ArcGIS QueryTask and Query
      let queryTask = new QueryTask({
        url: enrichUrl
      });
      let query = new Query({
        where: "propertyid = '" + propertyid + "'",
        returnGeometry: true,
        outFields: "*"
      })

      queryTask.execute(query)
        .then(handleQueryResults)
        .catch(handleQueryFail)

    } else {
      console.error("property id not found, can't fetch enrichment data")
    }
  })

  function handleQueryResults(results){
    let attributes = results.features[0].attributes;
    console.log("enrich query results:", attributes)

    // Add the results to the UI. This demo uses jQuery but this would work well in a Handlebars template, React template, etc
    let stats = ['totpop_cy', 'tothh_cy', 'avghhsz_cy', 'cs01_cy', 'cs04_cy', 'cs05_cy', 'cs12_cy', 'cs13_cy', 'cs19_cy', 'pp_cy', 'ppidx_cy', 'pppc_cy']
    stats.forEach(stat => {
      $('#' + stat).text(attributes[stat])
    });

    // Add the polygon to an ArcGIS map, and display the stats section
    createDrivetimeMap(results.features[0]);
    $("#stats").show();
  }

  function createDrivetimeMap(polygon) {
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic"
    ], function(Map, View, Graphic) {
      // Create the drivetime map
      esrimap = new Map({
        basemap: "gray-vector"
      });

      var view = new View({
        container: "drivetimeMap",
        map: esrimap,
        zoom: zoom,
        center: [longitude, latitude],
        ui: { components: ["attribution"] } // remove the Zoom in/out buttons
      });

      // Prevent navigation
      view.on(["click", "drag", "double-click", "mouse-wheel", "hold", ], function(event) {
        event.stopPropagation();
      });

      var fillSymbol = {
        type: "simple-fill",
        color: "#77AD1C",
        outline: {
          color: "#77AD1C",
          width: 1
        }
      };

      // Add the geometry and symbol to a new graphic
      var polygonGraphic = new Graphic({
        geometry: polygon.geometry,
        symbol: fillSymbol
      });
      view.graphics.add(polygonGraphic);
      view.goTo(polygonGraphic)

    })
  }

  function handleQueryFail(error){
    console.error("There was a problem running the enrichment query:", error)
    $("#stats").hide();
  }

}