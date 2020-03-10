mapboxgl.accessToken = config.token;

var jrMap = {
  stations: {},
  popup: null
}

jrMap.map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/jrpass/ck6bh6yi426ap1inxrg6huiii', // stylesheet location
  center: [138.46, 37.46], // starting position [lng, lat]
  zoom: 4.72,
  hash: true
});

// Show a popup when the user clicks on a station
jrMap.map.on('click', function(e) {
	jrMap.popup = new mapboxgl.Popup();
  var lat = e.lngLat.lat;
  var lng = e.lngLat.lng;

  // Get all of the features within 5px of the location clicked
	var bbox = [[e.point.x - 5, e.point.y - 5],[e.point.x + 5, e.point.y + 5]];
  var features = jrMap.map.queryRenderedFeatures(bbox);

  // iterate through them to find only the desired features (ie, those with a
  // layerID value in the config file)
  features.map(function(feat) {
  	for(var layerID in config.layerIDs){
  		if (feat.layer.id === layerID){
  			console.log(feat.layer.id)

  			// Show the value of this layer's specified field in a popup
  			var fieldName = config.layerIDs[layerID];
  			var value = feat.properties[fieldName];

  			if (!jrMap.popup.isOpen()) {
  				jrMap.popup.setLngLat([lng,lat])
  					.setHTML(value)
  					.addTo(jrMap.map);
  			}

  		}
  	}
  });
});

// Configure the station search using Bloodhound/Typeahead
var bloodhoundEngine = new Bloodhound({
  datumTokenizer: function (datum) {
    return Bloodhound.tokenizers.whitespace(datum.value);
  },
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  limit: 15,
  remote: {
    url: config.stationSearch.url + '?q=%QUERY',
    wildcard: '%QUERY',
    transform: function (response) {
      return $.map(response, function (station) {
        // Store the coordinates of each station so we can zoom the map if the
        // station is selected
        jrMap.stations[station[config.stationSearch.nameField]] = {
          "latitude": station[config.stationSearch.latField],
          "longitude": station[config.stationSearch.longField]
        }
        return (station[config.stationSearch.nameField]);
      });
    }
  }
});
bloodhoundEngine.initialize();

$('#stationSearch .typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'stations',
  source: bloodhoundEngine
});

$('#stationSearch').on('typeahead:selected', function(evt, suggestion) {
  var station = jrMap.stations[suggestion];

  // Add a marker to the map at the station location
  var el = document.createElement('div');
  el.className = 'marker';

  // var popup = new mapboxgl.Popup({
  //   offset: 25,
  //   closeButton: true,
  //   closeOnClick: true
  // });

  var popup = new mapboxgl.Popup({
    offset: 25,
    closeButton: true,
    closeOnClick: true
  })
    .setText(suggestion)
    .setLngLat([station.longitude, station.latitude])
    .addTo(jrMap.map);

  var marker = new mapboxgl.Marker(el)
    .setLngLat([station.longitude, station.latitude])
    .addTo(jrMap.map)
    .setPopup(popup);

  jrMap.map.flyTo({
    center: [station.longitude,station.latitude],
    zoom: 12,
    curve: 1,
    essential: true
  });
});

// End of station search


