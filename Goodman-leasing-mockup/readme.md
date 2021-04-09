# Goodman Leasing pages mockup

This demo is a proof-of-concept for the design at https://ogilvy-aus.invisionapp.com/share/D210BDV8W9AF#/screens/445843816 and was written by Stephen Lead (Stephen.Lead@FullExtent.com.au, 0410-638-348) for Goodman.

## Requirements

#### Include the Google Maps API and CSS

```
<script src="https://maps.googleapis.com/maps/api/js?key=your-api-key&callback=initMap&libraries=&v=weekly" async></script>
#gmap {height: 600px;}
```

#### Include the ArcGIS Server API and CSS

```
<link rel="stylesheet" href="https://js.arcgis.com/4.18/esri/themes/light/main.css" />
<script src="https://js.arcgis.com/4.18/"></script>
#drivetimeMap {height: 400px; width: 100%;}
```

#### Add Property information to the DOM

An element somewhere on the page must contain the property details as data- objects:

```
<h1 id="title"
    data-propertyname='M7 Business Hub'
    data-propertyid='7a915ae6-1bc4-47e8-88a9-27082e7b6c85'
    data-latitude='-33.8130869'
    data-longitude='150.8412945'
    data-zoom='15'
>
    M7 Business Hub
</h1>
```

`propertyid`, `latitude` and `longitude` are required at a minimum, while the `zoom` value can be used to finesse the starting extent of the Google map.

(During testing, `propertyname` is being used as a proxy for `propertyid`; this can be removed once `propertyid` is available on the ArcGIS Server layer)

#### Fetching the property boundary for the Google map

The Google map is instantiated at the lat/long specified above:

`gmap = new google.maps.Map(document.getElementById("gmap"), {center: { lat: latitude, lng: longitude }, zoom: zoom,});`

There is a layer in SmartSpace holding the property boundaries. This is queried using the `propertid` value to obtain the GeoJSON polygons:

```
// Publicly-accessible property boundary layer
let propertyUrl = 'https://smartspace.goodman.com/arcgis/rest/services/PropertyBoundariesTemplate/FeatureServer/0';

// Fetch the GeoJSON representation of the property and load it into the map
propertyUrl += '/query?outFields=*&returnGeometry=true&f=geojson';

// Create a where clause using the propertyid  query 
propertyUrl += "&where=propertyid=%27" + propertyid + "%27";

// Use this propertyUrl to load the GeoJSON
gmap.data.loadGeoJson(propertyUrl);

```

#### Fetching the drivetime polygon and statistics for the ArcGIS map

There is a layer holding the drivetime polygons and associated population/spending statistics. This layer is currently protected by a token, but will need to be made publicly accessible.

`let enrichUrl = 'https://smartspace.goodman.com/arcgis/rest/services/Hosted/enriched_drivetimes/FeatureServer/0';`

Using an ArcGIS Server [QueryTask](https://developers.arcgis.com/javascript/latest/api-reference/esri-tasks-QueryTask.html) the applicable polygon is fetched basd on the `propertyid`. This polygon contains the shape plus attributes required to populate the demographic charts.

```
let queryTask = new QueryTask({url: enrichUrl});

let query = new Query({
    where: "propertyid = '" + propertyid + "'",
    returnGeometry: true,
    outFields: "*"
});

queryTask.execute(query).then(handleQueryResults)
```

The `handleQueryResults` function adds the polygon to the map, and parses the attributes to add them to the DOM. This demo uses a simple jQuery substitution to demonstrate the concept.

```
let stats = ['total_population', 'total_households', 'avg_household_size', 'food_beverage', 'clothing', 'footwear', 'medical_products', 'electronics', 'personal_care', 'purchasing_power', 'purchasing_power_index', 'purchasing_power_per_capita']
stats.forEach(stat => {
    $('#' + stat).text(attributes[stat])
});
````

The stats have been renamed with human-readable values so should be self-explanatory. The query response also includes the calculations used to generate the polygon (drivetime/minutes vs straight-line/kilometres ) and the distance (45 minutes driving time in this example):

```
country: Australia
distance: 45.0
buffer_type: Driving Time
```

The drivetime polygons and statistics will be calculated automatically (at the conclusion of this project) using a back-end script, so new Goodman properties will automatically appear in this database when the script is re-run.