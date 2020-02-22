mapboxgl.accessToken = config.token;

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/jrpass/ck6bh6yi426ap1inxrg6huiii', // stylesheet location
  center: [138.46, 37.46], // starting position [lng, lat]
  zoom: 4.72
});

var popup;

map.on('click', function(e) {
	popup = new mapboxgl.Popup();
    var lat = e.lngLat.lat;
    var lng = e.lngLat.lng;

    // Get all of the features within 5px of the location clicked
	var bbox = [[e.point.x - 5, e.point.y - 5],[e.point.x + 5, e.point.y + 5]];
    var features = map.queryRenderedFeatures(bbox);

    // iterate through them to find only the desired features (ie, those with a
    // layerID value in the config file)
    features.map(function(feat) {
		for(var layerID in config.layerIDs){
			if (feat.layer.id === layerID){
				console.log(feat.layer.id)

				// Show the value of this layer's specified field in a popup
				var fieldName = config.layerIDs[layerID];
				var value = feat.properties[fieldName];

				if (!popup.isOpen()) {
					console.log("opening popup for ", feat.layer.id, " with ", value)
					popup.setLngLat([lng,lat])
						.setHTML(value)
						.addTo(map);
				}

			}
		}
    });

});
