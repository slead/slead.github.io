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
        appId: "HvT9UDdNs8w63Ary",
        // portalUrl: "https://spatial-portal.industry.nsw.gov.au/portal/",
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
        portalItem: {id: "1d51d6346f644950afdaea8871fadc94"}
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