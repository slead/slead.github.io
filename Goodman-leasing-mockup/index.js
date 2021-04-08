let gmap, esrimap, latitude, longitude, propertyid, zoom, name;
let propertyUrl = 'https://smartspace.goodman.com/arcgis/rest/services/PropertyBoundariesTemplate/FeatureServer/0';
let enrichUrl = 'https://smartspace.goodman.com/arcgis/rest/services/Hosted/Leasing_enriched_drivetimes/FeatureServer/0';

// TODO: A token is required until the layer is made publicly-accessible
let token = 'rQqU52eE3CXxIznkRKgQLwEXdCD-CGBoL9j1VitT95VEJxL5YJTM_68oGbP2JpQ5ehqJdTahk6cQOpbUVCS_FqIJMEEnryw7y2pin0ovWv8SlvrYn47BPyAhtsYbp0YIZ6LwnqB444UoXyBgKTwPPSxtIBW1EznaM1BAsJUCdntq14bMg6VEP7z_0TMCM5ezLnGq47zWjHGpY7QJOHkXGY6XvQ3nZp-S3xZT8iTTmpM.'
enrichUrl += "?token=" + token;

function initMap() {

  require([
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query"
  ], function(QueryTask, Query) {

    // retrieve the lat/long/zoom from the data-elements
    latitude = $("#title").data('latitude');
    longitude = $("#title").data('longitude')
    zoom = $("#title").data('zoom') || 15;
    objectid = $("#title").data('objectid');
    propertyid = $("#title").data('propertyid');
    name = $("#title").data('name');

    if (latitude && longitude && objectid && propertyid && name){
      gmap = new google.maps.Map(document.getElementById("gmap"), {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
      });

      // Fetch the GeoJSON representation of the property and load it into the map
      propertyUrl += '/query?outFields=*&returnGeometry=true&f=geojson';

      // Create a where clause using the applicable query (objectid, propertyid, or name)
      // propertyUrl += '&where=objectid=' + objectid;
      // propertyUrl += "&where=propertyid=%27" + propertyid + "%27";
      propertyUrl += "&where=name=%27" + name.replaceAll(" ", "%20") + "%27";

      // Use this propertyUrl to load the GeoJSON
      gmap.data.loadGeoJson(propertyUrl);
    } else {
      console.error("Can't find all required property details so map won't be shown")
    }

    if (propertyid){
      // Fetch the enriched data
      let queryTask = new QueryTask({
        url: enrichUrl
      });
      let query = new Query({
        where: "propertyid = '" + propertyid + "'",
        returnGeometry: true,
        outFields: "*",
        token: token
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

    // Add the results to the UI
    let stats = ['totpop_cy', 'tothh_cy', 'avghhsz_cy', 'cs01_cy', 'cs04_cy', 'cs05_cy', 'cs12_cy', 'cs13_cy', 'cs19_cy', 'pp_cy', 'ppidx_cy', 'pppc_cy']
    stats.forEach(stat => {
      $('#' + stat).text(attributes[stat])
    });

    $("#stats").show();
    createDrivetimeMap();   
    
  }

  function handleQueryFail(error){
    console.error("There was a problem running the enrichment query:", error)
    $("#stats").hide();
  }

  function createDrivetimeMap() {
    require([
      "esri/Map",
      "esri/views/MapView"
    ], function(Map, View) {
      // Create the drivetime map
      esrimap = new Map({
        basemap: "topo-vector"
      });

      var view = new View({
        container: "drivetimeMap",
        map: esrimap,
        zoom: zoom,
        center: [longitude, latitude] // longitude, latitude
      });

    })
  }
}