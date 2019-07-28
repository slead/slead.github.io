# SPOT3 live GPS tracker

This map takes the feed from the [SPOT Gen3 personal tracker](https://au.findmespot.com/en/index.php?cid=100) and adds it to an ArcGIS Server 3D web scene.

The default application from SPOT is pretty limited, so this app takes the AJAX feed used by the default map and creates a near-real-time view of the user's current position.

In this demo, the huts and walking track polylines for the Overland Track have been added.

Every 2.5 minutes the app clears the previous GPS positions, then fetches the latest positions from the SPOT feed. There is an option to ignore values before the specified `startDate` date, which should be in the format `YYYY-MM-DD`.
