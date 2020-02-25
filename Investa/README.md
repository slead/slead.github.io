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




