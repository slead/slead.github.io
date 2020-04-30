# Investa 3D

This is a stand-alone 3D version of the Investa property search map at https://www.investa.com.au/properties

The original version uses the Google Maps API whereas this version using ArcGIS Server's JavaScript API.

As with the original 2D map, the Investa search API at https://www.investa.com.au/www_investa/api/SearchProperty.ashx?v1 is called each time the map extent changes.

Buildings are stored in 3D in ArcGIS Server, with the PropertyID value of the building matching the PropertyID value from the Investa search API. Buildings are also sliced into individual floors, for future display of vacant floors (this it not yet hooked up).

To test this application locally, download it into your web server directory. Configuration options are found in the `js\config.js` file - the main value which may require changing is the URL to the search API, `searchUrl`.

#### Reverse proxy

If the search API is on a different domain to the application, it may be necessary to use a [reverse proxy](https://kirillplatonov.com/2017/11/12/simple_reverse_proxy_on_mac_with_nginx/) to avoid cross-origin issues.

Add the URL to the search API into your nginx config file:

```
location /investa_server/ {
  proxy_pass https://www.investa.com.au/www_investa/api/;
}
```

Then use this in the config file as the search URL:

`searchUrl: 'http://localhost:8080/investa_server/SearchProperty.ashx?v1',`

and access the application via http://localhost:8080.....

## Stacking plan view

Investa required the ability to open the map centred on a specified property, showing the 'stacking plan', or 3D side-on view of each building. eg https://www.investa.com.au/properties/135-king-street

This is a two-step process, first requiring the creation of a unique Slide for each building, and finessing of the slide's viewpoint, before the buildings can be displayed on the individual property page.

### Creating the slides

Open the file slides.html, and it will automatically iterate through all of the buildings found in the 3D buildings layer.

The script will then create a new Slide with the name of the building's PropertyID value (unless a slide already exists for that building).

The slides will be shown in the right-hand panel of the screen. Use the Save button to write the changes to the web scene on ArcGIS Online (you'll need an admin login to Investa's ArcGIS Online for this)

### Finessing the slides

The slide is automatically calculated based on the combined extent of the building's floors, and probably won't show the building in its best light.

Open the web scene (specified in the config.js file as `webMapID`) in Investa's ArcGIS Online.

Each slide can be finessed by choosing it in the editor panel, adjusting its viewpoint, then saving the web scene (remembering to reset the starting viewpoint of the web scene to show all of Australia).

### Displaying the stacking plan view

The property.html page is a mockup showing how to integrate the 3D map with the CMS. It requires a hidden element on the page which shows the PropertyID of the current building:

`$(".PropertyIDHidden input").val()`

The slide matching this PropertyID is chosen, and the map opens showing this building's extent, as finessed in the previous step.

`js/propertyMap.js` is the file containing the code that demonstrates how interaction between the Availability table and the map is possible.

### Updating the slides

If a new building is added to the portfolio, the slides.html file should be opened again, causing a new slide to be generated for the new building. Existing slides won't be affected, so their saved viewpoints will not be changed.
