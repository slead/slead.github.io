require([
    "esri/views/MapView",
    "esri/WebMap",
    "esri/widgets/LayerList",
    "esri/portal/Portal",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager"
    ], 
    function(
        MapView,
        WebMap,
        LayerList,
        Portal,
        OAuthInfo,
        esriId
    ) {

    const info = new OAuthInfo({
        appId: "JNywHQSYkzrfoxdw",
        // portalUrl: "https://<host>:<port>/arcgis"
        popup: false
    });
    esriId.registerOAuthInfos([info]);

    esriId
        .checkSignInStatus(info.portalUrl + "/sharing")
        .then((status) => {
            console.log("signed in status", status)
        })
        .catch(() => {
            console.error("not signed in")
        });

    var webmap = new WebMap({
    portalItem: {
        id: "c1edd5c42b684a9cb8a00cec8ff8c859"
    }
    });

    var view = new MapView({
    map: webmap,
    container: "viewDiv"
    });

    view.when(function() {
        var layerList = new LayerList({
            view: view
        });
        view.ui.add(layerList, "top-right");
    });

});