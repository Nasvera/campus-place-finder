/*global */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.date.locale");

dojo.require("dojox.widget.Standby");
dojo.require("dijit.form.ComboBox");

dojo.require("esri.map");
dojo.require("esri.tasks.geometry");
dojo.require("esri.dijit.OverviewMap");
dojo.require("esri.layers.FeatureLayer");

dojo.require("js.config");
dojo.require("js.date");

var map; //variable to store map object
var geometryService; //variable to store the Geometry service used for Geo-coding

var tempGraphicLayer = 'tempGraphicLayer'; //variable to store temp graphic layer id
var queryGraphicLayer = 'queryGraphicLayer'; //variable to store query graphic layer id
var tempServiceRequestLayerId = "tempServiceRequestLayerID"; //variable to store temporary graphics request layer id

var operationalLayersCollection; //variable used to store operational layer details

var serviceRequest; //variable used to store service request layer
var serviceRequestLayerInfo; //variable used to store information on service request layer
var serviceRequestSymbolURL; //variable used to store picture marker symbol for service request layer

var personText;  //default text to display on search address for person
var placeText; //default text to display on search address for place
var defaultSearch; //variable to store default search type

var queryTaskUrl; //variable to store URL for querying all buildings and floors
var personLayer; //variable used to store the person layer
var placeLayer; //variable used to store the place layer

var defaultBuilding; //variable to store default building on load of map
var currentBuilding; //variable to store current building

var defaultFloor; //variable to store default floor of the current building
var currentFloor; //variable to store selected floor

var floorSwitcher; //variable to enable or disable floor switchers

var infoWindowDescriptionFields;
var outsideBuilding = "outside"; //variable used to identify a service request outside a building

var showNullValueAs; //variable to store the default value for replacing null values
var mapSharingOptions; //variable for storing the tiny service URL

var baseMapLayers; //Variable for storing base map layers
var windowURL = window.location.toString();

var isSubmitDisabled = false; //This variable will be set to 'true' if service request button is enabled
var helpFileURL; // variable to store the help file URL
var messages; //variable to store alert messages

var infoPopupHeight; //variable used for storing the info window height
var infoPopupWidth; //variable used for storing the info window width

var lastSearchString; //variable for store the last search string
var stagedSearch; //variable for store the time limit for search
var lastSearchTime; //variable for store the time of last search
var buildingID;
var floorID;
var serviceRequestFields;
var databaseFields;
var buildingFloorFields;
var onLoadBldg;

//This initialization function is called when the DOM elements are ready
function Init() {
    ShowLoadingMessage();
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    esri.config.defaults.io.alwaysUseProxy = false;
    esri.config.defaults.io.timeout = 600000;    //timeout for query task

    dojo.connect(window, "onresize", function () {
        if (map) {
            map.resize();
            map.reposition();
        }
    });

    //Identify the key presses while implementing auto-complete and assign appropriate actions
    dojo.connect(dojo.byId("txtAddress"), 'onkeyup', function (evt) {//onkey up event for auto search functionality
        if (evt) {
            var keyCode = evt.keyCode;
            if (keyCode == 27) {
                dojo.byId('txtAddress').focus();
                RemoveChildren(dojo.byId('tblAddressResults'));
                return;
            }
            if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                evt = (evt) ? evt : event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
                return;
            }
            if (dojo.coords("divAddressContent").h > 0) {
                if (dojo.byId('txtAddress').value.trim() != "") {
                    if (lastSearchString !== dojo.byId("txtAddress").value.trim()) {
                        lastSearchString = dojo.byId("txtAddress").value;
                        RemoveChildren(dojo.byId("tblAddressResults"));
                        dojo.byId("imgSearchLoader").style.display = "block";

                        // Clear any staged search
                        clearTimeout(stagedSearch);
                        if (dojo.byId("txtAddress").value.trim().length > 0) {
                            stagedSearch = setTimeout(function () {
                                Locate();
                                lastSearchedValue = dojo.byId("txtAddress").value.trim();
                            }, 500);
                        }
                    }
                } else {
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    dojo.byId("imgSearchLoader").style.display = "none";
                    RemoveChildren(dojo.byId("tblAddressResults"));
                    SetHeightAddressResults();
                }
            }
        }
    });

    dojo.connect(dojo.byId("txtAddress"), 'onpaste', function (evt) {
        setTimeout(function () {
            Locate();
        }, 100);
    });

    dojo.connect(dojo.byId("txtAddress"), 'oncut', function (evt) {
        setTimeout(function () {
            Locate();
        }, 100);
    });

    dojo.connect(dojo.byId("imgLocate"), 'onclick', function (evt) {
        if (dojo.byId('txtAddress').value.trim() == "") {
            alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
            dojo.byId("imgSearchLoader").style.display = "none";
            return;
        }
        dojo.byId("imgSearchLoader").style.display = "none";
        Locate();
    });

    var responseObject = new js.config();
    this.document.title = responseObject.ApplicationName;
    mapSharingOptions = responseObject.MapSharingOptions;
    baseMapLayers = responseObject.BaseMapLayers;

    var imgBasemap = document.createElement('img');
    imgBasemap.src = "images/imgbasemap.png";
    imgBasemap.className = "imgOptions";
    imgBasemap.title = "Switch Basemap";
    imgBasemap.id = "imgBaseMap";
    imgBasemap.style.cursor = "pointer";
    imgBasemap.onclick = function () {//onclick event for image on base-map header
        ShowBaseMaps();
    }
    var infoWindow = new mobile.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });

    dojo.byId("tdBaseMap").appendChild(imgBasemap);
    dojo.byId("tdBaseMap").className = "tdHeader";
    dojo.byId('divSplashContent').innerHTML = responseObject.SplashScreenMessage; //set the content inside splash screen
    ShowLoadingMessage();
    dojo.byId('imgApp').src = responseObject.ApplicationImage; //set the path for application logo
    dojo.byId('lblAppName').innerHTML = responseObject.ApplicationName; //set the application name
    dojo.byId("divLogo").style.display = "block";

    var lods = [
                      { "level": 0, "resolution": 156543.033928, "scale": 591657527.591555 },
                      { "level": 1, "resolution": 78271.5169639999, "scale": 295828763.795777 },
                      { "level": 2, "resolution": 39135.7584820001, "scale": 147914381.897889 },
                      { "level": 3, "resolution": 19567.8792409999, "scale": 73957190.948944 },
                      { "level": 4, "resolution": 9783.93962049996, "scale": 36978595.474472 },
                      { "level": 5, "resolution": 4891.96981024998, "scale": 18489297.737236 },
                      { "level": 6, "resolution": 2445.98490512499, "scale": 9244648.868618 },
                      { "level": 7, "resolution": 1222.99245256249, "scale": 4622324.434309 },
                      { "level": 8, "resolution": 611.49622628138, "scale": 2311162.217155 },
                      { "level": 9, "resolution": 305.748113140558, "scale": 1155581.108577 },
                      { "level": 10, "resolution": 152.874056570411, "scale": 577790.554289 },
                      { "level": 11, "resolution": 76.4370282850732, "scale": 288895.277144 },
                      { "level": 12, "resolution": 38.2185141425366, "scale": 144447.638572 },
                      { "level": 13, "resolution": 19.1092570712683, "scale": 72223.819286 },
                      { "level": 14, "resolution": 9.55462853563415, "scale": 36111.909643 },
                      { "level": 15, "resolution": 4.77731426794937, "scale": 18055.954822 },
                      { "level": 16, "resolution": 2.38865713397468, "scale": 9027.977411 },
                      { "level": 17, "resolution": 1.19432856685505, "scale": 4513.988705 },
                      { "level": 18, "resolution": 0.597164283559817, "scale": 2256.994353 },
                      { "level": 19, "resolution": 0.298582141647617, "scale": 1128.497176 },
                      { "level": 20, "resolution": 0.149291444416222, "scale": 564.25 },
                      { "level": 21, "resolution": 0.0746443992887986, "scale": 282.12 },
                      { "level": 22, "resolution": 0.037470366607399885, "scale": 141.62 }
                    ];

    map = new esri.Map("map", {//load map object
        slider: true,
        infoWindow: infoWindow,
        lods: lods
    });

    //store config parameters
    personText = responseObject.PersonText;
    dojo.byId("txtAddress").setAttribute("displayPerson", personText);
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("displayPerson");
    placeText = responseObject.PlaceText;
    dojo.byId("txtAddress").setAttribute("displayPlace", placeText);

    defaultSearch = responseObject.DefaultSearch;
    helpFileURL = responseObject.HelpURL;
    defaultBuilding = responseObject.DefaultBuilding;
    defaultFloor = responseObject.DefaultFloor;
    currentBuilding = defaultBuilding;
    currentFloor = defaultFloor;
    serviceRequest = responseObject.ServiceRequest;
    serviceRequestLayerInfo = serviceRequest.LayerInfo;

    queryTaskUrl = responseObject.QueryTaskURL;
    personLayer = responseObject.PersonLayer;
    placeLayer = responseObject.PlaceLayer;
    floorSwitcher = responseObject.FloorSwitcher;
    operationalLayersCollection = responseObject.OperationalLayers;
    showNullValueAs = responseObject.ShowNullValueAs;
    commentsInfoPopupFieldsCollection = responseObject.CommentsInfoPopupFieldsCollection;
    serviceRequestFields = responseObject.ServiceRequestFields;
    databaseFields = responseObject.DatabaseFields;
    buildingFloorFields = responseObject.BuildingFloorFields;
    infoPopupHeight = responseObject.InfoPopupHeight;
    infoPopupWidth = responseObject.InfoPopupWidth;
    dojo.byId('divAddressContainer').style.display = "block";
    dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.connect(dojo.byId('txtAddress'), "onfocus", function () {
        this.style.color = "#fff";
    });
    //enable default search based on config parameters
    if (defaultSearch.Place) {
        ShowPlaceSearch();
    }
    else {
        ShowPersonSearch();
    }
    CreateBaseMapComponent();
    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);
    if (floorSwitcher.IsExpressVisible) {
        dojo.byId('divAccordion').style.top = '175px';
    }
    else {
        dojo.byId('divAccordion').style.top = '80px';
    }

    dojo.connect(map, "onLoad", function (evt) {
        //share map extent
        var zoomExtent;
        var extent = GetQuerystring('extent');
        if (extent != "") {
            extent = extent.split('$')
            zoomExtent = extent[0].split(',');
        }
        else {
            zoomExtent = responseObject.DefaultExtent.split(",");
        }
        var startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
        map.setExtent(startExtent);

        //store ID of shared info-window from URL
        var FeatureID;
        var bldgFeatureID;
        var flrFeatureID;
        var url = esri.urlToObject(window.location.toString());
        if (url.query && url.query != null) {
            if (url.query.extent.split("$SelectedId=").length > 0) {
                FeatureID = url.query.extent.split("$SelectedId=")[1];
            }
            if (url.query.extent.split("$buildingID=").length > 0) {
                var bldgID = url.query.extent.split("$buildingID=")[1];
                if (bldgID) {
                    if (bldgID.split("$floorID=").length > 0) {
                        bldgFeatureID = bldgID.split("$floorID=")[0];
                        flrFeatureID = bldgID.split("$floorID=")[1];
                    }
                }
            }
        }

        if (bldgFeatureID && flrFeatureID) {
            MapInitFunction(map, evt, bldgFeatureID);
        } else {
            MapInitFunction(map, evt, FeatureID);
        }
        if (bldgFeatureID && flrFeatureID) {
            onLoadBldg = true;
            currentBuilding = bldgFeatureID;
            OnloadFloors(bldgFeatureID, flrFeatureID);
        }
        if (FeatureID) {
            if (isNaN(FeatureID)) {
                // query operational layer for getting the location of shared info-window based on the its ID
                var queryTask = new esri.tasks.QueryTask(operationalLayersCollection[0].MapURL);
                var query = new esri.tasks.Query();
                query.where = operationalLayersCollection[0].ShareQuery.split("${0}")[0] + FeatureID + operationalLayersCollection[0].ShareQuery.split("${0}")[1];
                query.outFields = ["*"];
                query.outSpatialReference = map.spatialReference;
                query.returnGeometry = true;
                queryTask.execute(query, function (features) {
                    var windowPoint = features.features[0].geometry.getExtent().getCenter();
                    selectedGraphics = windowPoint;
                    var title;
                    if (dojo.string.substitute(personLayer.Title, features.features[0].attributes).trim() != ":") {
                        title = dojo.string.substitute(personLayer.Title, features.features[0].attributes);
                    }
                    else {
                        title = showNullValueAs;
                    }
                    onLoadBldg = true;
                    currentBuilding = dojo.string.substitute(operationalLayersCollection[0].Building, features.features[0].attributes);
                    OnloadFloors(dojo.string.substitute(operationalLayersCollection[0].Building, features.features[0].attributes), dojo.string.substitute(operationalLayersCollection[0].Floor, features.features[0].attributes));
                    // querying the person layer for getting the details of shared info-window based on its ID
                    var queryTask1 = new esri.tasks.QueryTask(personLayer.QueryURL);
                    var query1 = new esri.tasks.Query();
                    var condition = dojo.string.substitute(personLayer.WhereQuery, features.features[0].attributes);
                    query1.where = condition;
                    query1.outFields = [personLayer.OutFields];

                    setTimeout(function () {
                        queryTask1.execute(query1, function (feature) {
                            if (feature.features.length > 0) {
                                for (var key in feature.features[0].attributes) {
                                    if (!feature.features[0].attributes[key]) {
                                        feature.features[0].attributes[key] = features.features[0].attributes[key];
                                    }
                                }
                                CreateDetails(feature.features[0].attributes, dojo.byId("divPersonDetails"));
                            }
                            else {
                                var outfields = query1.outFields[0].split(",");
                                for (var key in outfields) {
                                    if (!features.features[0].attributes[outfields[key]]) {
                                        features.features[0].attributes[outfields[key]] = showNullValueAs;
                                    }

                                }
                                CreateDetails(features.features[0].attributes, dojo.byId("divPersonDetails"));
                            }
                            map.infoWindow.hide();
                            map.infoWindow.resize(infoPopupWidth, infoPopupHeight);
                            dojo.byId('divDetailsInfo').style.display = "block";
                            dojo.byId("detailsInfoTitle").innerHTML = title.trimString(35);
                            map.infoWindow.show(windowPoint);
                            map.setExtent(startExtent);
                            SelectedId = FeatureID;
                        });
                    }, 500);
                });
            }
            else {
                //share info-window for existing service request
                var queryTask = new esri.tasks.QueryTask(serviceRequestLayerInfo.ServiceURL);
                var query = new esri.tasks.Query();
                query.where = serviceRequestLayerInfo.ShareQuery.split("${0}")[0] + FeatureID + serviceRequestLayerInfo.ShareQuery.split("${0}")[1];
                query.outFields = ["*"];
                query.outSpatialReference = map.spatialReference;
                query.returnGeometry = true;
                queryTask.execute(query, function (features) {
                    onLoadBldg = true;
                    var buildingAttribute = dojo.string.substitute(serviceRequestLayerInfo.Building, features.features[0].attributes);
                    if (buildingAttribute != outsideBuilding) {
                        OnloadFloors(buildingAttribute, dojo.string.substitute(serviceRequestLayerInfo.Floor, features.features[0].attributes));
                    }
                    else {
                        OnloadFloors();
                    }
                    isSubmitDisabled = true;
                    currentFloor = dojo.string.substitute(serviceRequestLayerInfo.Floor, features.features[0].attributes);
                    currentBuilding = buildingAttribute;
                    ToggleServiceRequestLayer();
                    ShowServiceRequestDetails(features.features[0].geometry, features.features[0].attributes);
                    evt = (evt) ? evt : event;
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    map.setExtent(startExtent); //set the extent of shared map
                });

            }
        }
    });

    dojo.connect(dojo.byId('imgHelp'), "onclick", function () {
        window.open(responseObject.HelpURL);
    });

    dojo.connect(map, "onExtentChange", function (evt) {
        if (selectedGraphics) {//used to reset the position of info-window when extent is changed
            var screenPoint = map.toScreen(selectedGraphics);
            screenPoint.y = map.height - screenPoint.y;

            setTimeout(function () {
                map.infoWindow.setLocation(screenPoint);
            }, 700);
            return;
        }
        if (dojo.coords("divAppContainer").h > 0) {
            ShareLink(false)
        }
    });
}

//Function to create graphics and feature layer
function MapInitFunction(map, evt, featureid) {
    dojo.byId('map_zoom_slider').style.top = '80px';
    dojo.byId('divSplashScreenContainer').style.display = "block";
    dojo.addClass(dojo.byId('divSplashScreenContent'), "divSplashScreenDialogContent");
    SetSplashScreenHeight();
    //Event to resize map

    dojo.connect(map, 'resize', function () {
        var resizeTimer;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            map.resize();
            map.reposition();
        }, 500);
    });

    //load error message file
    dojo.xhrGet(
                    {
                        url: "ErrorMessages.xml",
                        handleAs: "xml",
                        preventCache: true,
                        load: function (xmlResponse) {
                            messages = xmlResponse;
                        }
                    });

    //add map overview
    var overviewMapDijit = new esri.dijit.OverviewMap({
        map: map,
        attachTo: "bottom-left",
        visible: false
    });

    overviewMapDijit.startup();
    AddFeatureLayers();
    dojo.connect(map, "onClick", DoIdentify);

    //Add temp graphics layer on map
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempGraphicLayer;
    map.addLayer(gLayer);

    //Add query graphics layer on map
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = queryGraphicLayer;
    map.addLayer(gLayer);

    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempServiceRequestLayerId;
    map.addLayer(gLayer);
    if (!featureid) {
        OnloadFloors();
    }
    LiftHandler();

    if (serviceRequest.isEnabled) {
        AddServiceRequestLayerOnMap();
    }
    else {
        dojo.byId('tdSubmitRequest').style.display = 'none';
    }
    dojo.connect(map, "onExtentChange", function () {
        dijit.popup.close();
    });
    dojo.connect(dojo.byId('txtSpinner'), "onmousewheel", SpinnerMouseWheelEvent);
    dojo.connect(dojo.byId('imgPlus'), "onclick", LoadNextBuilding);
    dojo.connect(dojo.byId('imgMinus'), "onclick", LoadPreviousBuilding);
    dojo.connect(map.infoWindow, "onHide", HideInfoWindow);
}
dojo.addOnLoad(Init); //call init function when application is loaded
