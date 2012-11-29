/** @license
 | Version 10.1.1
 | Copyright 2012 Esri
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
function CreateBaseMapComponent() {
    if (baseMapLayerCollection.length != 0) {
        for (var i = 0; i < baseMapLayerCollection.length; i++) {
            CreateBaseMapLayer(baseMapLayerCollection[i].MapURL, baseMapLayerCollection[i].Key, (i == 0) ? true : false);
        }

        if (baseMapLayerCollection.length == 1 || !isBasemapSwitcherEnabled) {
            dojo.byId('tdBaseMap').style.display = 'none';
            HideLoadingMessage();
            return;
        }

        var mapList = dojo.byId('divContainer');
        var mapTable = document.createElement('table');
        var mapTbody = document.createElement('tbody');
        mapTable.cellSpacing = 0;
        mapList.appendChild(mapTable);
        mapTable.appendChild(mapTbody);
        for (var i = 0; i < Math.ceil(baseMapLayerCollection.length / 2); i++) {
            var previewDataRow = document.createElement("tr");
            mapTbody.appendChild(previewDataRow);
            if (baseMapLayerCollection[(i * 2) + 0]) {
                var layerInfo = baseMapLayerCollection[(i * 2) + 0];
                previewDataRow.appendChild(CreateBaseMapElement(layerInfo));
            }
            if (baseMapLayerCollection[(i * 2) + 1]) {
                var layerInfo = baseMapLayerCollection[(i * 2) + 1];
                previewDataRow.appendChild(CreateBaseMapElement(layerInfo));
            }
        }

        if (!(dojo.isIE < 9)) {
            dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key), "selectedBaseMap");
            if (dojo.isIE) {
                dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key), "selectedBaseMap");
                dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key).style.marginTop = "-5px";
                dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key).style.marginLeft = "-5px";
                dojo.byId("spanBaseMapText" + baseMapLayerCollection[0].Key).style.marginTop = "5px";
            }
        }
        //dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[0].Key), "selectedBaseMap");
    }
    else {
        ShowDialog('Error', 'No basemap layer found. Atleast one basemap layer is required. Please contact your administrator.');
        HideLoadingMessage();
    }
}

function CreateBaseMapElement(baseMapLayerInfo) {
    var tdBasemap = document.createElement('td');
    tdBasemap.style.width = '110px';
    var tblContainer = document.createElement('table');
    tblContainer.style.width = '100%';
    var tBody = document.createElement('tbody');
    var trImage = document.createElement('tr');
    var trSpan = document.createElement('tr');
    var tdImage = document.createElement('td');
    tdImage.id = "tdImage" + baseMapLayerInfo.Key;
    tdImage.align = 'center';
    tdImage.style.verticalAlign = 'middle';
    tdImage.height = 75;
    var tdSpan = document.createElement('td');
    tdSpan.align = 'center';

    var imgThumbnail = document.createElement("img");
    imgThumbnail.src = baseMapLayerInfo.ThumbnailSource;
    imgThumbnail.className = "basemapThumbnail";
    imgThumbnail.id = "imgThumbNail" + baseMapLayerInfo.Key;
    imgThumbnail.setAttribute("layerId", baseMapLayerInfo.Key);
    imgThumbnail.onclick = function () {
        ChangeBaseMap(this);
    };

    var spanBaseMapText = document.createElement("span");
    spanBaseMapText.id = "spanBaseMapText" + baseMapLayerInfo.Key;
    spanBaseMapText.className = "basemapLabel";
    spanBaseMapText.innerHTML = baseMapLayerInfo.Name;

    tdBasemap.appendChild(tblContainer);
    tblContainer.appendChild(tBody);
    tBody.appendChild(trImage);
    tBody.appendChild(trSpan);
    trImage.appendChild(tdImage);
    trSpan.appendChild(tdSpan);
    tdImage.appendChild(imgThumbnail);
    tdSpan.appendChild(spanBaseMapText);

    return tdBasemap;
}

function ChangeBaseMap(spanControl) {
    HideMapLayers();
    var key = spanControl.getAttribute('layerId');

    for (var i = 0; i < baseMapLayerCollection.length; i++) {
        dojo.removeClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMap");
        if (dojo.isIE) {
            dojo.removeClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMap");
            dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginTop = "0px";
            dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginLeft = "0px";
            dojo.byId("spanBaseMapText" + baseMapLayerCollection[i].Key).style.marginTop = "0px";
        }
        if (baseMapLayerCollection[i].Key == key) {
            if (!(dojo.isIE < 9)) {
                dojo.addClass(dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key), "selectedBaseMap");
                if (dojo.isIE) {
                    dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginTop = "-5px";
                    dojo.byId("imgThumbNail" + baseMapLayerCollection[i].Key).style.marginLeft = "-5px";
                    dojo.byId("spanBaseMapText" + baseMapLayerCollection[i].Key).style.marginTop = "5px";
                }
            }

            for (var urlCount = 0; urlCount < baseMapLayerCollection[i].MapURL.length; urlCount++) {
                var layer = map.getLayer(baseMapLayerCollection[i].MapURL[urlCount].LayerId);
                if (layer) {
                    ShowHideBaseMapComponent();
                    layer.show();
                }
            }
        }
    }
}

function CreateBaseMapLayer(layerURL, layerId, isVisible) {
    var layer = '';
    if (layerURL.length > 0) {
        for (var count = 0; count < layerURL.length; count++) {
            layer = new esri.layers.ArcGISTiledMapServiceLayer(layerURL[count].MapURL, { id: layerURL[count].LayerId, visible: isVisible });
            map.addLayer(layer);
        }
    }
}

function HideMapLayers() {
    for (var i = 0; i < baseMapLayerCollection.length; i++) {
        for (var urlCount = 0; urlCount < baseMapLayerCollection[i].MapURL.length; urlCount++) {
            var layer = map.getLayer(baseMapLayerCollection[i].MapURL[urlCount].LayerId);
            if (layer) {
                layer.hide();
            }
        }
    }
}

function ShowHideBaseMapComponent() {
    var node = dojo.byId('divBaseMapTitleContainer');
    var anim = dojo.byId('divContainer');
    var divNode = dojo.byId('divAddressContainer');
    if (dojo.coords(divNode).h > 0) {
        WipeOutControl(divNode, 500);
    }

    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
    else {
        WipeInControl(node, node.style.height, 500);
    }
}

function AddFeatureLayers() {
    if (operationalLayersCollection.length != 0) {
        for (var i = 0; i < operationalLayersCollection.length; i++) {
            var layerId = operationalLayersCollection[i].Key;

            if (operationalLayersCollection[i].hasDynamicMapService) {
                var mapserverURL = operationalLayersCollection[i].MapURL.substr(0, operationalLayersCollection[i].MapURL.lastIndexOf('/'));
                var visibleLayers = [operationalLayersCollection[i].MapURL.substr(operationalLayersCollection[i].MapURL.lastIndexOf('/') + 1)];
                var dynamicMapService = new esri.layers.ArcGISDynamicMapServiceLayer(mapserverURL,
                { id: "dynamic" + layerId });
                dynamicMapService.setVisibleLayers(visibleLayers);
                map.addLayer(dynamicMapService);
            }

            var featureLayer = CreateLineFeatureLayer(operationalLayersCollection[i], layerId, operationalLayersCollection[i].isLayerVisible);

            if (operationalLayersCollection[i].hasDynamicMapService) {
                var symbol = new esri.symbol.SimpleFillSymbol().setColor(new dojo.Color([0, 0, 0, 0]));
                var renderer = new esri.renderer.SimpleRenderer(symbol);
                featureLayer.setRenderer(renderer);
            }
            map.addLayer(featureLayer);

            if (operationalLayersCollection[i].BuildingAttribute) {
                dojo.connect(featureLayer, "onClick", ShowDetailsInfo);
            }
        }
    }
    else {
        ShowDialog('Error', 'No operational layer found. At least one operational layer is required. Please contact your administrator.');
        HideLoadingMessage();
    }
}

function CreateLineFeatureLayer(layer, layerId, isLayerVisible) {
    var lineLayer = new esri.layers.FeatureLayer(layer.MapURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"],
        id: layerId,
        displayOnPan: false,
        visible: isLayerVisible
    });

    return lineLayer;
}