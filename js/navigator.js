/** @license
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
function liftHandler() {
    dijit.byId('btnNavigator').setChecked(true);
    if (floorSwitcher.IsExpressVisible || floorSwitcher.IsAccordionVisible) {
        if (floorSwitcher.IsExpressVisible && floorSwitcher.IsAccordionVisible) {
            dojo.byId('divExpress').style.display = 'block';
            dojo.byId('divAccordion').style.display = 'block';
        }
        else if (floorSwitcher.IsExpressVisible) {
            dojo.byId('divExpress').style.display = 'block';
            dojo.byId('divAccordion').style.display = 'none';
        }
        else {
            dojo.byId('divAccordion').style.display = 'block';
            dojo.byId('divExpress').style.display = 'none';
        }
    }
    else {
        SelectFeatures(defaultBuilding, 1);
        dojo.byId('tdFloorNavigator').style.display = 'none';
        dojo.byId('divExpress').style.display = 'none';
        dojo.byId('divAccordion').style.display = 'none';
    }
}

function ToggleNavigator() {
    if (dijit.byId('btnNavigator').checked) {
        if (floorSwitcher.IsExpressVisible) {
            dojo.byId('divExpress').style.display = 'block';
        }

        if (floorSwitcher.IsAccordionVisible) {
            dojo.byId('divAccordion').style.display = 'block';
        }
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 500);
        }

    }
    else {
        dojo.byId('divExpress').style.display = 'none';
        dojo.byId('divAccordion').style.display = 'none';
        var divNode = dojo.byId('divBaseMapTitleContainer');
        if (dojo.coords(divNode).h > 0) {
            WipeOutControl(divNode, 500);
        }
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 500);
        }

    }
}

var currentIndex = 0;

function InitializeSpinner(arrayObject, floor) {
    currentIndex = Number(GetFloorName(arrayObject, floor));

    dojo.byId('txtSpinner').value = arrayObject[GetFloorName(arrayObject, floor)].id;
    dojo.byId('spanExpress').innerHTML = arrayObject[0].feature.attributes.BUILDINGKEY;
}

function SpinnerMouseWheelEvent(evt) {
    var arrayObject = arrBuilding[dojo.byId('spanExpress').innerHTML];
    var evt = window.event || evt; //equalize event object
    var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; //delta returns +120 when wheel is scrolled up, -120 when scrolled down
    if (delta <= -120) {        //toggle down
        currentIndex -= 1;
        if (currentIndex < 0) {
            currentIndex += 1;
        }
        else {
            dojo.byId('txtSpinner').value = arrayObject[currentIndex].id;
            ExpressChangeEvent(dojo.byId('txtSpinner').value);
        }
    }
    else {                      //toggle up
        currentIndex += 1;
        if (currentIndex > (arrayObject.length) - 1) {
            currentIndex -= 1;
        }
        else {
            dojo.byId('txtSpinner').value = arrayObject[currentIndex].id;
            ExpressChangeEvent(dojo.byId('txtSpinner').value);
        }
    }
}

function LoadNextBuilding(evt) {
    map.infoWindow.hide();
    var arrayObject = arrBuilding[dojo.byId('spanExpress').innerHTML];
    currentIndex += 1;
    if (currentIndex > (arrayObject.length) - 1) {
        currentIndex -= 1;
    }
    else {
        dojo.byId('txtSpinner').value = arrayObject[currentIndex].id;
        ExpressChangeEvent(dojo.byId('txtSpinner').value);
    }
};

function LoadPreviousBuilding(evt) {
    map.infoWindow.hide();
    var arrayObject = arrBuilding[dojo.byId('spanExpress').innerHTML];
    currentIndex -= 1;
    if (currentIndex < 0) {
        currentIndex += 1;
    }
    else {
        dojo.byId('txtSpinner').value = arrayObject[currentIndex].id;
        ExpressChangeEvent(dojo.byId('txtSpinner').value);
    }
};

//function to get floor number based on index
function GetFloorName(arrayObject, floor) {
    for (var i in arrayObject) {
        if (arrayObject[i].id == floor) {
            return i;
            break;
        }
    }
    return 0;
}

function ExpressChangeEvent(floor) {
    if (floor) {
        currentFloor = floor;
        if (currentBuilding) {
            LocateBuildingFloors(arrBuilding[currentBuilding], currentFloor);
        }
        else {
            LocateBuildingFloors(arrBuilding[defaultBuilding], currentFloor);
        }
        ToggleServiceRequestLayer();
    }
}

function ChangeFloor(imgControl) {
    map.infoWindow.hide();
    var arr = imgControl.id.split('-');
    var buildingKey = arr[0];
    var floor = arr[1];

    if (buildingKey == currentBuilding) {
        if (currentFloor != floor) {
            currentFloor = floor;
            for (var building in arrBuilding) {
                for (var floors in arrBuilding[building]) {
                    dojo.byId(building + '-' + arrBuilding[building][floors].id).src = 'images/bullet.png';
                }
            }
            InitializeSpinner(arrBuilding[currentBuilding], currentFloor);
            ExpressChangeEvent(currentFloor);
            imgControl.src = 'images/bulletHighlight.png';
        }
    }
    else {
        currentBuilding = buildingKey;
        currentFloor = floor;
        for (var building in arrBuilding) {
            if (building == currentBuilding) {
                InitializeSpinner(arrBuilding[building], currentFloor);
                CreateFloorSwitcher(arrBuilding, building, currentFloor);
                LocateBuildingFloors(arrBuilding[building], currentFloor);
            }
        }
    }
    ToggleServiceRequestLayer();
}

function SelectFeatures(building, floor) {
    var query = new esri.tasks.Query();
    var building = building;
    var floor = floor;

    for (var layerIndex in operationalLayersCollection) {
        query.where = dojo.string.substitute(operationalLayersCollection[layerIndex].WhereQuery, [building, floor]);
        query.outFields = ["*"];
        ShowLoadingMessage('Loading...');
        var featureLayer = map.getLayer(operationalLayersCollection[layerIndex].Key);
        if (operationalLayersCollection[layerIndex].hasDynamicMapService) {
            var dynamicMapServiceLayer = map.getLayer("dynamic" + operationalLayersCollection[layerIndex].Key);
            var layerDefinitions = [];
            layerDefinitions[operationalLayersCollection[layerIndex].MapURL.substr(operationalLayersCollection[layerIndex].MapURL.lastIndexOf('/') + 1)] = query.where;
            dynamicMapServiceLayer.setLayerDefinitions(layerDefinitions);
        }
        featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
            if (features.length > 0) {
                if (features[0].geometry.type == 'polygon' && !isShowingSearchResult) {
                    if (!isShowingSearchResult) {
                        map.setExtent(GetExtentPolygon(features).expand(2));
                    }
                }
            }
            HideLoadingMessage();
        });
    }
}

//function to get Extent from featureset
function GetExtentPolygon(featureSet) {
    var extent;
    dojo.forEach(featureSet, function (feature, i) {
        if (extent) {
            extent = extent.union(feature.geometry.getExtent());
        }
        else {
            extent = feature.geometry.getExtent();
        }
    });
    return extent;
}

function CreateFloorSwitcher(buildingArray, building, selectedFloor) {
    for (var bldg in buildingArray) {
        var divContainer;
        if (dojo.byId('divContainer' + bldg)) {
            divContainer = dojo.byId('divContainer' + bldg);
            dojo.byId('divContainer' + bldg).innerHTML = '';
        }
        else {
            divContainer = document.createElement('div');
            divContainer.id = 'divContainer' + bldg;
        }

        var tableHeader = document.createElement('table');
        tableHeader.id = 'tblHeader' + bldg;
        tableHeader.style.width = '100%';
        divContainer.appendChild(tableHeader);

        var tbodyHeader = document.createElement('tbody');
        tbodyHeader.id = 'tbodyHeader' + bldg;
        tableHeader.appendChild(tbodyHeader);

        var trHeader = document.createElement('tr');
        trHeader.id = 'trHeader' + bldg;
        tbodyHeader.appendChild(trHeader);

        var tdHeader = document.createElement('td');
        tdHeader.id = 'tdHeader' + bldg;
        trHeader.appendChild(tdHeader);

        var table = document.createElement('table');
        table.style.width = '100%';
        tdHeader.appendChild(table);
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        tr.appendChild(td);
        var spanBuilding = document.createElement('span');
        spanBuilding.id = 'spanBuilding' + bldg;
        spanBuilding.style.marginLeft = '10px';
        spanBuilding.innerHTML = bldg;

        td.appendChild(spanBuilding);
        var td1 = document.createElement('td');
        td1.align = 'right';
        tr.appendChild(td1);
        var spanImg = document.createElement('span');
        spanImg.id = 'spanImg' + bldg;
        td1.appendChild(spanImg);

        var img = document.createElement('img');
        img.style.width = '15px';
        img.style.height = '15px';
        img.id = 'imgLevel-' + bldg;
        img.onclick = function () { ShowHideLevel(this); }
        spanImg.appendChild(img);

        var trContent = document.createElement('tr');
        trContent.id = 'trContent' + bldg;
        tbodyHeader.appendChild(trContent);

        var tdContent = document.createElement('td');
        tdContent.id = 'tdContent' + bldg;
        trContent.appendChild(tdContent);

        var floorDiv = document.createElement('div');
        floorDiv.id = 'floorDiv-' + bldg;
        tdContent.appendChild(floorDiv);

        if (bldg == building) {
            img.src = 'images/font-minus.png';
            img.className = "text";
            WipeInControl(floorDiv, 50, 1000);
        }
        else {
            img.src = 'images/font-plus.png';
            img.className = "disabledText";
            WipeOutControl(floorDiv, 1000);
        }

        var floorTable = document.createElement('table');
        floorTable.id = 'tblFloor' + bldg;
        floorTable.className = 'contentBackground';
        floorTable.align = 'center';
        floorDiv.appendChild(floorTable);

        var floorTbody = document.createElement('tbody');
        floorTbody.id = 'tbodyFloor' + bldg;
        floorTable.appendChild(floorTbody);

        var floorTr = document.createElement('tr');
        floorTr.id = 'floorTr' + bldg;
        floorTbody.appendChild(floorTr);

        var tdLeft = document.createElement('td');
        tdLeft.id = 'tdLeft' + bldg;
        floorTr.appendChild(tdLeft);

        var tableLeft = document.createElement('table');
        tableLeft.id = 'tblLeft' + bldg;
        tdLeft.appendChild(tableLeft);

        var tbodyLeft = document.createElement('tbody');
        tbodyLeft.id = 'tbodyLeft' + bldg;
        tableLeft.appendChild(tbodyLeft);


        var tdRight = document.createElement('td');
        tdRight.id = 'tdRight' + bldg;
        tdRight.style.verticalAlign = 'top';
        floorTr.appendChild(tdRight);

        var tableRight = document.createElement('table');
        tableRight.id = 'tblRight' + bldg;
        tableRight.style.marginLeft = '40px';
        tdRight.appendChild(tableRight);

        var tbodyRight = document.createElement('tbody');
        tbodyRight.id = 'tbodyRight' + bldg;
        tableRight.appendChild(tbodyRight);
        for (var floors = buildingArray[bldg].length - 1; floors >= 0; floors--) {
            var tr = document.createElement('tr');
            tr.id = 'trFloor' + floors;
            if (buildingArray[bldg].length % 2 != 0) {
                if (floors % 2 == 0) {
                    tbodyLeft.appendChild(tr);
                }
                else {
                    tbodyRight.appendChild(tr);
                }
            }
            else {
                if (floors % 2 == 0) {
                    tbodyRight.appendChild(tr);
                }
                else {
                    tbodyLeft.appendChild(tr);
                }
            }

            var td = document.createElement('td');
            td.id = 'tdFloor' + floors;
            tr.appendChild(td);
            var floorImg = document.createElement('img');
            td.appendChild(floorImg);
            if (bldg == building && buildingArray[bldg][floors].id == selectedFloor) {
                floorImg.src = 'images/bulletHighlight.png';
            }
            else {
                floorImg.src = 'images/bullet.png';
            }
            floorImg.onclick = function () {
                isShowingSearchResult = false;
                ChangeFloor(this);
            }
            floorImg.style.width = '15px';
            floorImg.style.height = '15px';
            floorImg.style.cursor = 'pointer';
            floorImg.id = bldg + '-' + buildingArray[bldg][floors].id;
            var td1 = document.createElement('td');
            td1.id = 'td1Floor' + floors;
            tr.appendChild(td1);
            var floorSpan = document.createElement('span');
            floorSpan.innerHTML = buildingArray[bldg][floors].id;
            floorSpan.id = 'spanFloor' + buildingArray[bldg][floors].id;
            td1.appendChild(floorSpan);
        }
        dojo.byId('divAccordion').appendChild(divContainer);
    }
}

function ShowHideLevel(evt) {
    var level = evt.id.split('-')[1];
    var divNode = dojo.byId('floorDiv-' + level);

    if (dojo.coords(divNode).h > 0) {
        WipeOutControl(divNode, 500);
        evt.src = 'images/font-plus.png';
    }
    else {
        WipeInControl(divNode, 50, 500);
        evt.src = 'images/font-minus.png';
    }

}