/** @license
 | Version 10.2
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
var mapPoint;                   //Variable for storing map point location
var buildingCount;              //Variable for storing total building count

var arrBuilding = [];           //Variable for storing features grouped by building
var arrBuildingFloors = [];     //Variable for storing features grouped by building floors

var arrPlacesBySpaceType = [];  //Variable for storing places grouped by space types
var isShowingSearchResult = false;
var SelectedId;
var selectedGraphics;

//Get candidate results for person name/place name
function Locate() {
    var thisSearchTime = lastSearchTime = (new Date()).getTime();
    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId('divAddressScrollContainer'));
    var searchText = dojo.byId('txtAddress').value.trim();
    var query = new esri.tasks.Query();
    query.outSpatialReference = map.spatialReference;
    query.returnGeometry = true;
    var queryTask;
    if (searchText != '') {
        dojo.byId("imgSearchLoader").style.display = "block";
        if (dojo.hasClass('tdSearchPerson', 'tdSearchByPerson')) {     //person search is selected
            //query person layer to fetch searched details
            queryTask = new esri.tasks.QueryTask(personLayer.QueryURL);
            var queryFields = personLayer.QueryFields.split(',');
            var whereClause = '';
            if (searchText.lastIndexOf(' ') > 0) {
                for (var index in queryFields) {
                    var name = (index == 0) ? searchText.substr(0, searchText.lastIndexOf(' ')) : searchText.substr(searchText.lastIndexOf(' ') + 1);
                    whereClause += "UPPER(" + queryFields[index] + ") LIKE '" + name.toUpperCase().trim() + "%' OR ";
                }
            }
            else {
                for (var index in queryFields) {
                    whereClause += "UPPER(" + queryFields[index] + ") LIKE '" + searchText.toUpperCase().trim() + "%' OR ";
                }
            }

            whereClause = whereClause.slice(0, whereClause.length - 3);
            query.where = whereClause;
            query.outFields = ["*"];
            queryTask.execute(query, function (featureSet) {
                if (thisSearchTime < lastSearchTime) {
                    return;
                }
                PopulatePersons(featureSet);

            }, function (err) {
                alert(err.message);
                dojo.byId("imgSearchLoader").style.display = "none";
            });
        }
        else {  //Place search is selected

            //query place layer to fetch searched details
            queryTask = new esri.tasks.QueryTask(placeLayer.QueryURL);
            var queryFields = placeLayer.QueryFields.split(',');
            var whereClause = '';
            for (var index in queryFields) {
                whereClause += "UPPER(" + queryFields[index] + ") LIKE '%" + searchText.toUpperCase() + "%' OR ";
            }
            whereClause = whereClause.slice(0, whereClause.length - 3);
            query.where = whereClause;
            query.outFields = [placeLayer.OutFields];
            queryTask.execute(query, function (featureSet) {
                if (thisSearchTime < lastSearchTime) {
                    return;
                }
                GroupPlacesBySpaceType(featureSet);

            }, function (err) {
                alert(err.message);
                dojo.byId("imgSearchLoader").style.display = "none";
            });
        }
    }
    else {
        dojo.byId("imgSearchLoader").style.display = "none";
    }
}

//sort features by name
function SortByName(a, b) {
    var x = a.attributes[personLayer.FirstName] + " " + a.attributes[personLayer.LastName];
    var y = b.attributes[personLayer.FirstName] + " " + b.attributes[personLayer.LastName];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}

//show details of person search
function PopulatePersons(featureSet) {
    var features = featureSet.features;
    features.sort(SortByName);
    if (features.length > 0) {
        var table = dojo.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        var feature;

        for (var i = 0; i < features.length; i++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.innerHTML = features[i].attributes[personLayer.FirstName] + " " + features[i].attributes[personLayer.LastName];
            if (td1.innerHTML.toLowerCase() == dojo.byId('txtAddress').value.trim().toLowerCase()) {
                feature = featureSet.features[i];
            }
            td1.className = 'tdAddress';
            td1.style.cursor = "pointer";
            td1.height = 20;
            td1.id = i;
            td1.title = 'Click to Locate';
            _this = this;

            td1.onclick = function () { // on-click events for the list of searches available
                ShowLoadingMessage();
                HideCreateRequestContainer();
                HideCommentsContainer();
                map.infoWindow.hide();
                QueryRelatedRecords(featureSet.features[this.id]);
                HideAddressContainer();
                dojo.byId("txtAddress").setAttribute("displayPerson", this.innerHTML);
                dojo.byId("txtAddress").style.color = "gray";
                dojo.byId('txtAddress').value = this.innerHTML;
                lastSearchString = dojo.byId("txtAddress").value.trim();
            }
            tr.appendChild(td1);
        }
        SetHeightAddressResults();
    }
    else {
        //show error message if no searches are available
        dojo.byId("imgSearchLoader").style.display = "none";
        var table = dojo.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        dojo.byId("imgSearchLoader").style.display = "none";
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        tr.appendChild(td1);
        td1.height = 20;
        td1.innerHTML = messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue
    }
    dojo.byId("imgSearchLoader").style.display = "none";
}

//hide the address container
function HideAddressContainer() {
    lastSearchString = dojo.byId("txtAddress").value.trim();
    dojo.replaceClass("divAddressContent", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divAddressContent').style.height = '0px';

}

//fetch the details of queried person
function QueryRelatedRecords(feature) {
    var queryTask = new esri.tasks.QueryTask(operationalLayersCollection[0].MapURL);
    var query = new esri.tasks.Query();
    var condition = dojo.string.substitute(operationalLayersCollection[0].RelationshipQuery, feature.attributes);
    query.where = condition;
    query.outFields = ["*"];
    query.returnGeometry = true;

    //query person layer
    queryTask.execute(query, function (result) {
        if (!result.features[0]) {
            HideLoadingMessage();
            alert(dojo.byId('txtAddress').value + messages.getElementsByTagName("noLocationDet")[0].childNodes[0].nodeValue);
            lastSearchString = dojo.byId("txtAddress").value.trim();
            return;
        }

        var features = result.features[0];

        for (var attribute in feature.attributes) {
            features.attributes[attribute] = feature.attributes[attribute];
        }

        ShowSpaceFeature(features, personLayer);
    }, function (err) {
        dojo.byId("imgSearchLoader").style.display = "none";
        alert(messages.getElementsByTagName("noFeatureFound")[0].childNodes[0].nodeValue);
    });
}

//fetch details of searched place
function GroupPlacesBySpaceType(featureSet) {
    var features = featureSet.features;
    arrPlacesBySpaceType = [];
    arrSortedSpaceType = [];
    for (var i = 0; i < features.length; i++) {
        if (arrPlacesBySpaceType[dojo.string.substitute(placeLayer.SpaceType, features[i].attributes)]) {
            arrPlacesBySpaceType[dojo.string.substitute(placeLayer.SpaceType, features[i].attributes)].push(features[i]);
        }
        else {
            arrPlacesBySpaceType[dojo.string.substitute(placeLayer.SpaceType, features[i].attributes)] = [];
            arrPlacesBySpaceType[dojo.string.substitute(placeLayer.SpaceType, features[i].attributes)].push(features[i]);
        }
    }

    var newArray = [];
    var tempCount = [];

    for (var i in arrPlacesBySpaceType) {
        if (newArray[arrPlacesBySpaceType[i].length]) {
            newArray[arrPlacesBySpaceType[i].length] += ("," + i);
        }
        else {
            newArray[arrPlacesBySpaceType[i].length] = i;
            tempCount.push(arrPlacesBySpaceType[i].length);
        }
    }

    tempCount.sort(function (a, b) {
        return b - a;
    });

    for (var i in tempCount) {
        var spaceTypes = newArray[tempCount[i]].split(',');
        spaceTypes.sort();
        for (var val in spaceTypes) {
            arrSortedSpaceType[spaceTypes[val]] = arrPlacesBySpaceType[spaceTypes[val]];
        }
    }
    arrPlacesBySpaceType = null;

    if (features.length > 0) {
        PopulatePlacesInGroup(arrSortedSpaceType);
    }
    else {
        var table = dojo.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        dojo.byId("imgSearchLoader").style.display = "none";
        var tr = document.createElement("tr");
        tBody.appendChild(tr);
        var td1 = document.createElement("td");
        tr.appendChild(td1);
        td1.height = 20;
        td1.innerHTML = messages.getElementsByTagName("invalidSearch")[0].childNodes[0].nodeValue
    }
    HideLoadingMessage();
}

//categorize places in respective groups
function PopulatePlacesInGroup(arrSpaceTypes) {
    var table = dojo.byId("tblAddressResults");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    for (var spaceType in arrSpaceTypes) {
        if (arrSpaceTypes[spaceType].length > 0) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            tr.appendChild(td1);
            var tNode = document.createTextNode(spaceType + " (" + arrSpaceTypes[spaceType].length + ")");
            td1.appendChild(tNode);
            td1.className = 'tdAddress';
            td1.style.cursor = "pointer";
            td1.height = 20;
            td1.id = 'td-' + spaceType;

            var tbl = document.createElement("table");
            var tBodySub = document.createElement("tbody");
            tbl.appendChild(tBodySub);
            tbl.id = spaceType;
            tbl.style.display = 'none';
            if (dojo.isIE == 7) {          //Patch for fixing overflow-x issue in compatibility mode.
                tbl.style.width = "94%";
                tbl.style.overflowX = "hidden";
            }
            tbl.cellSpacing = 0;
            tbl.cellPadding = 0;

            for (var space in arrSpaceTypes[spaceType]) {
                var tr = document.createElement("tr");
                tBodySub.appendChild(tr);
                var td2 = document.createElement("td");
                tr.appendChild(td2);
                td2.id = spaceType + '-' + space;
                td2.className = 'tdSubAddress';
                td2.height = 20;
                td2.innerHTML = arrSpaceTypes[spaceType][space].attributes[placeLayer.SpaceID];
                td2.title = 'Click to Locate';
                td2.onclick = function (evt) {//on-click function for address list
                    ShowLoadingMessage();
                    map.infoWindow.hide();
                    HideCommentsContainer();
                    HideDetailsInfo();
                    HideCreateRequestContainer();

                    evt = (evt) ? evt : event;
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }

                    HideAddressContainer();
                    dojo.byId("txtAddress").setAttribute("displayPlace", dojo.string.substitute(operationalLayersCollection[0].ShareFields, arrSpaceTypes[this.id.split('-')[0]][this.id.split('-')[1]].attributes));
                    dojo.byId("txtAddress").style.color = "gray";
                    dojo.byId('txtAddress').value = dojo.string.substitute(operationalLayersCollection[0].ShareFields, arrSpaceTypes[this.id.split('-')[0]][this.id.split('-')[1]].attributes);
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    ShowSpaceFeature(arrSpaceTypes[this.id.split('-')[0]][this.id.split('-')[1]], placeLayer);
                    setTimeout(function () {
                        HideLoadingMessage();
                    }, 500);
                }
            }
            td1.appendChild(tbl);
            td1.onclick = function () {//reposition scroll bar when group is expanded
                var topPos = dojo.coords(dojo.byId('divAddressScrollContainerscrollbar_handle')).t;
                dojo.byId("imgSearchLoader").style.display = "block";
                ToggleGroupDisplay(this.id);
                SetHeightAddressResults();

                dojo.byId("imgSearchLoader").style.display = "none";
                dojo.byId('divAddressScrollContainerscrollbar_handle').style.top = '0px';
                if (topPos > 5) {
                    dojo.byId('divAddressScrollContainerscrollbar_handle').style.top = (topPos - 5) + 'px';
                }
                else {
                    dojo.byId('divAddressScrollContainerscrollbar_handle').style.top = topPos + "px";
                }

                var topPos = dojo.coords(dojo.byId('divAddressScrollContainerscrollbar_handle')).t;
                dojo.byId('divAddressScrollContainerscrollbar_handle').style.top = topPos + 'px';

            }
        }
    }
    SetHeightAddressResults();
    dojo.byId("imgSearchLoader").style.display = "none";
}

function ToggleGroupDisplay(spaceType) {
    var split = spaceType.split('-')[1];
    var table = dojo.byId(split);
    if (table.style.display == "none") {
        table.style.display = "block";
    }
    else {
        table.style.display = "none";
    }
}

//display selected building and floor and set accordion content
function ShowSpaceFeature(feature, layerInfo) {
    ClearGraphics();
    SelectedId = dojo.string.substitute(operationalLayersCollection[0].ShareFields, feature.attributes);
    var building = feature.attributes[placeLayer.QueryFields.split(',')[0]];
    var floor = feature.attributes[placeLayer.QueryFields.split(',')[1]];
    if (building != currentBuilding) {
        currentBuilding = building;
        currentFloor = floor;
        LocateBuildingFloors(arrBuilding[currentBuilding], currentFloor);
        InitializeSpinner(arrBuilding[currentBuilding], currentFloor);
        CreateFloorSwitcher(arrBuilding, currentBuilding, currentFloor);
        isShowingSearchResult = true;
    }
    else {
        if (floor != currentFloor) {
            currentFloor = floor;
            LocateBuildingFloors(arrBuilding[building], currentFloor);
            InitializeSpinner(arrBuilding[building], currentFloor);
            CreateFloorSwitcher(arrBuilding, building, currentFloor);
            isShowingSearchResult = true;
        }
    }
    ToggleServiceRequestLayer();

    //query person layer to get data required in info-window
    var queryTask = new esri.tasks.QueryTask(personLayer.QueryURL);
    var query = new esri.tasks.Query();
    var condition = dojo.string.substitute(personLayer.WhereQuery, feature.attributes);
    query.where = condition;
    query.outFields = [personLayer.OutFields];

    queryTask.execute(query, function (features) {
        for (var att in feature.attributes) {
            if (!feature.attributes[att]) {
                feature.attributes[att] = showNullValueAs;
            }
        }

        if (features.features.length > 0) {
            for (var att in features.features[0].attributes) {
                if (!features.features[0].attributes[att]) {
                    features.features[0].attributes[att] = showNullValueAs;
                }
            }

            for (var key in features.features[0].attributes) {
                if (!feature.attributes[key]) {
                    feature.attributes[key] = features.features[0].attributes[key];
                }
            }
        }
        else {
            var outfields = query.outFields[0].split(",");
            for (var key in outfields) {
                if (!feature.attributes[outfields[key]]) {
                    feature.attributes[outfields[key]] = showNullValueAs;
                }
            }
        }

        var title = '';
        var truncateContent = false;
        if ((feature.attributes[operationalLayersCollection[0].SpaceType] == "N/A") && (feature.attributes[operationalLayersCollection[0].SpaceID] == "N/A") || (!feature.attributes[operationalLayersCollection[0].SpaceType]) && (!feature.attributes[operationalLayersCollection[0].SpaceID])) {
            title = showNullValueAs;
            truncateContent = true;
        }
        else {
            title = dojo.string.substitute(layerInfo.Title, feature.attributes);
        }
        map.setExtent(GetBrowserMapExtent(feature.geometry.getExtent().getCenter()));
        selectedGraphics = feature.geometry.getExtent().getCenter();
        CreateInfoWindowContent(feature, layerInfo, truncateContent, dojo.byId("divPersonDetails"));

        setTimeout(function () {
            var windowPoint
            if (feature.geometry.contains(feature.geometry.getExtent().getCenter())) {
                windowPoint = feature.geometry.getExtent().getCenter();
            }
            else {
                windowPoint = feature.geometry.getPoint(0, 0);

            }

            if (truncateContent) {
                ShowInfoWindow(windowPoint, title, dojo.byId('divDetailsInfo'), dojo.byId("detailsInfoTitle"));
            }
            else {
                if (layerInfo.Key == "PlaceLayer" && isSubmitDisabled) {
                    ServiceRequestInfo(feature.attributes, title, dojo.byId("divPersonDetails"), windowPoint);
                }
                else {
                    ShowInfoWindow(windowPoint, title, dojo.byId('divDetailsInfo'), dojo.byId("detailsInfoTitle"));
                    HideLoadingMessage();
                }
            }
        }, 1000);

    }, function (err) {
    });
}

//set content info-window content
function CreateInfoWindowContent(feature, layerInfo, truncateContent, divContainer) {
    var divInfoContainer = document.createElement('div');
    divInfoContainer.id = "divInfoContainer";
    divInfoContainer.className = "infoContainer";

    var divInfoContent = document.createElement('div');
    divInfoContent.id = "divInfoContent";
    divInfoContent.style.display = "block";
    divInfoContent.className = 'infoContent';

    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.id = 'tblInfoWindow';
    table.style.paddingTop = "5px";
    table.appendChild(tBody);
    table.className = 'tblInfoWindow';
    table.cellSpacing = 0;
    table.cellPadding = 0;
    var attributes = feature.attributes;

    if (layerInfo.DateFields) {
        var dateFields = layerInfo.DateFields;
        for (var j = 0; j < dateFields.length; j++) {   //check for date type attributes and format date
            if (attributes[dateFields[j].AliasField]) {
                var timeStamp = attributes[dateFields[j].AliasField];
                attributes[dateFields[j].AliasField] = new Date(timeStamp).toDateString();
            }
        }
    }

    for (var i in layerInfo.InfoPopupFieldsCollection) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.className = 'tdDisplayField';
        td.innerHTML = layerInfo.InfoPopupFieldsCollection[i].DisplayText;
        td.vAlign = 'top';
        td.style.width = '40%';
        var td1 = document.createElement("td");
        td1.className = 'tdDisplayField';
        td1.vAlign = 'top';
        td1.style.width = '60%';

        if (layerInfo.InfoPopupFieldsCollection[i].HideCondition && truncateContent) {
            continue;
        }
        if (layerInfo.InfoPopupFieldsCollection[i].isLink) {
            var value = dojo.string.substitute(layerInfo.InfoPopupFieldsCollection[i].FieldName, attributes).trim();
            if (value == "N/A" || value == "N/A N/A") {
                td1.innerHTML = showNullValueAs;
            }
            else {//show email hyperlink for outlook
                var mailAnchor = document.createElement("a");
                mailAnchor.className = 'mailAnchor';
                mailAnchor.setAttribute("href", "mailto:" + value);
                mailAnchor.appendChild(document.createTextNode(dojo.string.substitute(layerInfo.InfoPopupFieldsCollection[i].FieldName, attributes)));
                td1.appendChild(mailAnchor);
            }
        }
        else {
            var value = dojo.string.substitute(layerInfo.InfoPopupFieldsCollection[i].FieldName, attributes).trim();
            if (value == "N/A" || value == "N/A N/A") {
                td1.innerHTML = showNullValueAs;
            }
            else {
                td1.innerHTML = dojo.string.substitute(layerInfo.InfoPopupFieldsCollection[i].FieldName, attributes);
            }
        }

        tr.appendChild(td);
        tr.appendChild(td1);
        tBody.appendChild(tr);
    }
    divInfoContent.appendChild(table);
    divInfoContainer.appendChild(divInfoContent);
    if (divContainer) {
        divContainer.appendChild(divInfoContainer);
    }
    else {
        return divInfoContainer;
    }
}

function ShowError(err) {
    alert(err.message);
    HideLoadingMessage();
}

//display building and floors on load of application
function OnloadFloors(building, floor) {
    if (building) {
        onLoadBuilding = building;
        onLoadFloor = floor;
        var shareEnable = "true";
    }
    else {
        onLoadBuilding = defaultBuilding;
        onLoadFloor = defaultFloor;
        var shareEnable = "false";
    }

    //query plain layer for floor of building to fetch the geometry coordinates
    var queryTask = new esri.tasks.QueryTask(queryTaskUrl.QueryURL);
    var query;
    query = new esri.tasks.Query();
    query.returnGeometry = false;
    query.outFields = ["*"];
    query.outSpatialReference = map.spatialReference;
    query.where = "1=1";
    queryTask.execute(query,
            function (fset) {
                if (fset.features.length) {
                    buildingCount = 0;
                    for (var i = 0; i < fset.features.length; i++) {
                        if (arrBuilding[dojo.string.substitute(queryTaskUrl.BuildingKey, fset.features[i].attributes)]) {
                            arrBuilding[dojo.string.substitute(queryTaskUrl.BuildingKey, fset.features[i].attributes)].push({ id: dojo.string.substitute(queryTaskUrl.Floor, fset.features[i].attributes), feature: fset.features[i] });
                        }
                        else {
                            arrBuilding[dojo.string.substitute(queryTaskUrl.BuildingKey, fset.features[i].attributes)] = [];
                            arrBuilding[dojo.string.substitute(queryTaskUrl.BuildingKey, fset.features[i].attributes)].push({ id: dojo.string.substitute(queryTaskUrl.Floor, fset.features[i].attributes), feature: fset.features[i] });
                            buildingCount++;
                        }
                    }

                    if (!onLoadBuilding) {
                        onLoadBuilding = dojo.string.substitute(queryTaskUrl.BuildingKey, fset.features[0].attributes);
                    }

                    if (floorSwitcher.IsExpressVisible && !floorSwitcher.IsAccordionVisible) {
                        InitializeSpinner(arrBuilding[onLoadBuilding], onLoadFloor);
                        SelectFeatures(onLoadBuilding, onLoadFloor);
                    }
                    if (floorSwitcher.IsAccordionVisible && !floorSwitcher.IsExpressVisible) {
                        CreateFloorSwitcher(arrBuilding, onLoadBuilding, onLoadFloor);
                        LocateBuildingFloors(arrBuilding[onLoadBuilding], onLoadFloor);
                    }
                    if (floorSwitcher.IsAccordionVisible && floorSwitcher.IsExpressVisible) {
                        if (onLoadBldg) {
                            InitializeSpinner(arrBuilding[onLoadBuilding], onLoadFloor);
                        }
                        else {
                            InitializeSpinner(arrBuilding[defaultBuilding], onLoadFloor);
                        }
                        CreateFloorSwitcher(arrBuilding, onLoadBuilding, onLoadFloor);
                        LocateBuildingFloors(arrBuilding[onLoadBuilding], onLoadFloor, shareEnable);
                    }

                    HideLoadingMessage();
                }
                else {
                    alert(messages.getElementsByTagName("noBuildingFound")[0].childNodes[0].nodeValue);
                    HideLoadingMessage();
                }
            },
            function (err) {
                alert(err);
                HideLoadingMessage();
            });
}

// function used to create tab container to submit service request
function CreateSubmitServiceRequestTabContainer(evt, searchContent) {
    var floorLayer = map.getLayer(queryGraphicLayer);
    dojo.byId('divCreateRequestContainer').style.display = "block";
    CreateDetails(evt, dojo.byId("divSubmitDetails"));
    dojo.byId("tdDetails").style.display = "none";
    dojo.byId("tdSubmitForm").style.display = "block";
    dojo.byId("divSubmitFormInfo").style.display = "none";
    dojo.byId("divSubmitDetails").style.display = "block";
    dojo.connect(dojo.byId("tdDetails"), "onclick", function () {
        if (dojo.byId("divSubmitRequestContainer")) {
            dojo.destroy(dojo.byId("divSubmitRequestContainer"));
        }
        dojo.byId("tdDetails").style.display = "none";
        dojo.byId("tdSubmitForm").style.display = "block";
        dojo.byId("divSubmitFormInfo").style.display = "none";
        dojo.byId("divSubmitDetails").style.display = "block";
    });

    dojo.byId("tdSubmitForm").onclick = function () {
        ShowSubmitRequestForm();
        dojo.byId("tdDetails").style.display = "block";
        dojo.byId("tdSubmitForm").style.display = "none";
        dojo.byId("divSubmitFormInfo").style.display = "block";
        dojo.byId("divSubmitDetails").style.display = "none";
    };
}

//create form to submit service request
function ShowSubmitRequestForm() {
    var divSubmitRequestContainer = document.createElement('div');
    divSubmitRequestContainer.id = 'divSubmitRequestContainer';
    divSubmitRequestContainer.className = 'divSubmitRequestContainer';
    dojo.byId("divSubmitFormInfo").appendChild(divSubmitRequestContainer);

    var divSubmitRequest = CreateServiceRequestForm();
    divSubmitRequest.className = 'divServiceRequestDetails';
    divSubmitRequest.style.height = (infoPopupHeight - 110) + "px";
    divSubmitRequestContainer.appendChild(divSubmitRequest);

    var div1 = document.createElement('div');
    div1.style.width = "100%";
    div1.style.height = "70px";
    div1.style.bottom = "5px";
    dojo.byId("divSubmitRequestContainer").appendChild(div1);
    var tableServiceRequesterror = document.createElement('table');
    tableServiceRequesterror.style.width = "98%";
    tableServiceRequesterror.style.paddingLeft = "5px";
    div1.appendChild(tableServiceRequesterror);

    var tbodyServiceRequesterror = document.createElement('tbody');
    tableServiceRequesterror.appendChild(tbodyServiceRequesterror);
    var tr6 = document.createElement('tr');
    var td61 = document.createElement('td');

    td61.style.height = '30px';
    td61.align = 'left';
    var spanServiceErrorMessage = document.createElement('span');
    spanServiceErrorMessage.id = 'spanServiceErrorMessage';
    spanServiceErrorMessage.style.color = 'Yellow';
    td61.appendChild(spanServiceErrorMessage);
    tr6.appendChild(td61);
    tbodyServiceRequesterror.appendChild(tr6);

    var table = document.createElement('table');
    table.style.width = "100%";
    div1.appendChild(table);
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    var tr = document.createElement('tr');
    tbody.appendChild(tr);
    CreateCommentAddTable(tr, "submitrequest", "btnSubmit", "btnClear");
    setTimeout(function () {
        CreateScrollbar(divSubmitRequestContainer, divSubmitRequest);
    }, 500);
}

//create form for new service request
function CreateServiceRequestForm() {
    if (dijit.byId('cbRequestType')) {
        dijit.byId('cbRequestType').destroy();
    }
    var divServiceRequestDetails = document.createElement('div');
    divServiceRequestDetails.style.width = '100%';
    divServiceRequestDetails.id = 'divServiceRequestDetails';

    var tableServiceRequestDetails = document.createElement('table');
    tableServiceRequestDetails.id = 'tableServiceRequestDetails';
    divServiceRequestDetails.appendChild(tableServiceRequestDetails);
    tableServiceRequestDetails.style.width = '98%';
    tableServiceRequestDetails.style.display = 'block';
    tableServiceRequestDetails.style.paddingLeft = "5px";
    tableServiceRequestDetails.style.paddingTop = "5px";
    tableServiceRequestDetails.cellPading = 0;
    tableServiceRequestDetails.cellSpacing = 0;

    var tbodyServiceRequestDetails = document.createElement('tbody');
    tableServiceRequestDetails.appendChild(tbodyServiceRequestDetails);

    var tr1 = document.createElement('tr');
    var td11 = document.createElement('td');
    td11.align = 'left';
    td11.style.width = '50px';
    td11.appendChild(document.createTextNode('Type:'));
    var td12 = document.createElement('td');
    td12.align = 'left';
    td12.style.paddingLeft = "4px";
    var cbRequestType = document.createElement('input');
    td12.appendChild(cbRequestType);
    var filteringSelect = new dijit.form.ComboBox({
        autocomplete: true,
        hasdownarrow: true,
        filteringselect: true,
        id: 'cbRequestType',
        store: serviceRequestStore,
        style: "width: 230px; height: 25px; background-color:  #333333; color: White;",
        onChange: function () {
            ValidateRequestType();
        }

    }, cbRequestType);
    dojo.connect(dojo.byId("widget_cbRequestType_dropdown"), "onmouseout", function () {
        dojo.query(".dijitMenuItemSelected").removeClass("dijitMenuItemSelected");
    });
    tr1.appendChild(td11);
    tr1.appendChild(td12);
    tbodyServiceRequestDetails.appendChild(tr1);

    var tr2 = document.createElement('tr');
    var td21 = document.createElement('td');
    td21.align = 'left';
    td21.appendChild(document.createTextNode('Description:'));
    var td22 = document.createElement('td');
    td22.align = 'left';
    var txtDescription = document.createElement('textarea');
    txtDescription.id = 'txtDescription';
    txtDescription.className = 'txtArea';
    txtDescription.onkeypress = "if (dojo.isIE) { return imposeMaxLength(this, 249); } else {return imposeMaxLength(this, 250); }"

    td22.appendChild(txtDescription);
    tr2.appendChild(td21);
    tr2.appendChild(td22);
    tbodyServiceRequestDetails.appendChild(tr2);

    var tr3 = document.createElement('tr');
    tr3.style.height = '25px';
    var td31 = document.createElement('td');
    td31.align = 'left';
    td31.appendChild(document.createTextNode('Name:'));
    var td32 = document.createElement('td');
    td32.align = 'left';
    var txtName = document.createElement('input');
    txtName.id = 'txtName';
    txtName.className = 'txtBox';
    td32.appendChild(txtName);
    tr3.appendChild(td31);
    tr3.appendChild(td32);
    tbodyServiceRequestDetails.appendChild(tr3);

    var tr4 = document.createElement('tr');
    var td41 = document.createElement('td');
    td41.align = 'left';
    td41.appendChild(document.createTextNode('Email:'));
    var td42 = document.createElement('td');
    td42.align = 'left';
    var txtMail = document.createElement('input');
    txtMail.id = 'txtMail';
    txtMail.className = 'txtBox';
    td42.appendChild(txtMail);
    tr4.appendChild(td41);
    tr4.appendChild(td42);
    tbodyServiceRequestDetails.appendChild(tr4);

    var tr5 = document.createElement('tr');
    var td51 = document.createElement('td');
    td51.align = 'left';
    td51.appendChild(document.createTextNode('Phone:'));
    var td52 = document.createElement('td');
    td52.align = 'left';
    var txtPhone = document.createElement('input');
    txtPhone.id = 'txtPhone';
    txtPhone.className = 'txtBox';
    td52.appendChild(txtPhone);
    tr5.appendChild(td51);
    tr5.appendChild(td52);
    tbodyServiceRequestDetails.appendChild(tr5);
    return divServiceRequestDetails;
}

//show picture marker symbol
function ServiceRequestInfo(evt, title, searchContent, windowPoint) {
    var symbol = '';
    var graphic = '';
    if (isSubmitDisabled) {
        map.getLayer(tempServiceRequestLayerId).clear();
        ShowLoadingMessage();

        //load picture marker symbol
        symbol = new esri.symbol.PictureMarkerSymbol(serviceRequestSymbolURL, 25, 25);

        graphic = new esri.Graphic(windowPoint, symbol, null, null);
        map.getLayer(tempServiceRequestLayerId).add(graphic);
        HideLoadingMessage();
        ShowFeatureDetails(evt, title, searchContent, windowPoint);
    }
}

function ShowFeatureDetails(evt, title, searchContent, windowPoint) {
    CreateSubmitServiceRequestTabContainer(evt, searchContent);
    ShowInfoWindow(windowPoint, title, dojo.byId('divSubmitFormInfo'), dojo.byId("tdCreateRequestHeader"));
}

//displaying a particular floor in a building
function LocateBuildingFloors(arrFloors, floorNo, shareEnabled) {
    ClearGraphics();
    var floorImg = '';
    for (var floor in arrFloors) {
        var building = dojo.string.substitute(serviceRequestLayerInfo.BuildingKey, arrFloors[floor].feature.attributes);

        if (floorSwitcher.IsAccordionVisible)
            floorImg = dojo.byId(building + '-' + arrFloors[floor].id);
        if (arrFloors[floor].id == floorNo) {
            SelectFeatures(building, floorNo, shareEnabled);

            if (floorSwitcher.IsAccordionVisible)
                floorImg.src = 'images/bulletHighlight.png';
        }
        else {
            if (floorSwitcher.IsAccordionVisible)
                floorImg.src = 'images/bullet.png';
        }
    }
}

var outsideServiceRequest = false;

//display general data in info-window on-click of map
function DoIdentify(evt) {
    map.infoWindow.hide();
    map.centerAt(evt.mapPoint);
    isShowingSearchResult = false;
    if (isSubmitDisabled) {
        //query building and floor layer
        var query = new esri.tasks.Query();
        query.geometry = evt.mapPoint;
        query.outFields = [serviceRequestLayerInfo.BuildingAttribute];
        query.returnGeometry = false;
        var queryTask = new esri.tasks.QueryTask(serviceRequestLayerInfo.BuildingFloorPlan);
        queryTask.execute(query, function (featureSet) {
            var attr = {};
            attr[buildingFloorFields.BuildingFieldName] = currentBuilding;
            attr[buildingFloorFields.FloorFieldName] = currentFloor;
            attr[buildingFloorFields.SpaceTypeFieldName] = "";
            attr[buildingFloorFields.SpaceIdFieldName] = "";
            attr[buildingFloorFields.SectionFieldName] = "";
            if (featureSet.features.length == 0) {
                outsideServiceRequest = true;
                attr[buildingFloorFields.BuildingFieldName] = outsideBuilding;
                attr[buildingFloorFields.FloorFieldName] = 1;
            }
            else if (featureSet.features.length > 0) {
                attr[buildingFloorFields.BuildingFieldName] = featureSet.features[0].attributes[serviceRequestLayerInfo.BuildingAttribute];
                attr[buildingFloorFields.FloorFieldName] = 1;
                for (var layerCount = 0; layerCount < operationalLayersCollection.length; layerCount++) {
                    if (operationalLayersCollection[layerCount].isLayerVisible) {
                        if (operationalLayersCollection[layerCount].BuildingAttribute) {
                            SelectBuilding(layerCount, evt.mapPoint);
                        }
                    }
                }
            }
            else {
                outsideServiceRequest = false;
            }
            var graphic = new esri.Graphic(evt.mapPoint, null, attr, null);
            evt.graphic = graphic;
            ShowDetailsInfo(evt);
        });
    }
    else {
        for (var layerCount = 0; layerCount < operationalLayersCollection.length; layerCount++) {
            if (operationalLayersCollection[layerCount].isLayerVisible) {
                if (operationalLayersCollection[layerCount].BuildingAttribute) {
                    SelectBuilding(layerCount, evt.mapPoint);
                }
            }
        }
    }
}

function SelectBuilding(layerCount, mapPoint) {
    var query = new esri.tasks.Query();
    query.geometry = mapPoint;
    query.outFields = [operationalLayersCollection[layerCount].BuildingAttribute];
    var queryTask = new esri.tasks.QueryTask(operationalLayersCollection[layerCount].MapURL);

    queryTask.execute(query, function (featureSet) {
        if (featureSet.features.length > 0) {
            var building = featureSet.features[0].attributes[operationalLayersCollection[layerCount].BuildingAttribute];
            currentBuilding = building;
            currentFloor = defaultFloor;
            ToggleServiceRequestLayer();
            InitializeSpinner(arrBuilding[currentBuilding], defaultFloor);
            CreateFloorSwitcher(arrBuilding, currentBuilding, defaultFloor);
            LocateBuildingFloors(arrBuilding[currentBuilding], defaultFloor);
        }
    });
}

//show details of selected person or place in info-window
function CreateDetails(attributes, valueField) {
    for (var count = 0; count < operationalLayersCollection.length; count++) {
        if (operationalLayersCollection[count].BuildingAttribute) {
            var operationalLayersCollectionRow = operationalLayersCollection[count];

            var divInfoContainer = document.createElement('div');
            divInfoContainer.id = "divInfoContainer";
            divInfoContainer.className = "infoContainer";

            var divInfoContent = document.createElement('div');
            divInfoContent.id = "divInfoContent";
            divInfoContent.style.display = "block";
            divInfoContent.className = 'infoContent';

            var table = document.createElement("table");
            var tBody = document.createElement("tbody");
            table.id = 'tblInfoWindow';
            table.style.paddingTop = "5px";
            table.appendChild(tBody);
            table.className = 'tblInfoWindow';
            table.cellSpacing = 0;
            table.cellPadding = 0;

            if (isSubmitDisabled) {
                var tr = document.createElement("tr");
                tr.style.height = "8px";
                tBody.appendChild(tr);
            }
            for (var att in attributes) {
                if (!attributes[att]) {
                    attributes[att] = showNullValueAs;
                }
            }
            var dateFields = personLayer.DateFields;
            for (var j = 0; j < dateFields.length; j++) {   //check for date type attributes and format date
                if (attributes[dateFields[j].ValueField]) {
                    var timeStamp = attributes[dateFields[j].ValueField];
                    attributes[dateFields[j].ValueField] = new Date(timeStamp).toDateString();
                }
            }

            for (var i in personLayer.InfoPopupFieldsCollection) {
                var tr = document.createElement("tr");
                var td = document.createElement("td");
                td.className = 'tdDisplayField';
                td.innerHTML = personLayer.InfoPopupFieldsCollection[i].DisplayText;
                td.vAlign = 'top';
                td.style.width = '40%';
                var td1 = document.createElement("td");
                td1.className = 'tdDisplayField';
                td1.vAlign = 'top';
                td1.style.width = '60%';

                if (personLayer.InfoPopupFieldsCollection[i].isLink) {
                    var value = dojo.string.substitute(personLayer.InfoPopupFieldsCollection[i].FieldName, attributes).trim();
                    if (value == "N/A") {
                        td1.innerHTML = showNullValueAs;
                    }
                    else {
                        var mailAnchor = document.createElement("a");
                        mailAnchor.className = 'mailAnchor';
                        mailAnchor.setAttribute("href", "mailto:" + value);
                        mailAnchor.appendChild(document.createTextNode(dojo.string.substitute(personLayer.InfoPopupFieldsCollection[i].FieldName, attributes)));
                        td1.appendChild(mailAnchor);
                    }
                }
                else
                    if (dojo.string.substitute(personLayer.InfoPopupFieldsCollection[i].FieldName, attributes).trim() != ":") {
                        var value = dojo.string.substitute(personLayer.InfoPopupFieldsCollection[i].FieldName, attributes);
                        if (value == "N/A N/A" || value == "N/A") {
                            td1.innerHTML = showNullValueAs;
                        }
                        else {
                            td1.innerHTML = dojo.string.substitute(personLayer.InfoPopupFieldsCollection[i].FieldName, attributes);
                        }
                    }
                tr.appendChild(td);
                tr.appendChild(td1);
                tBody.appendChild(tr);
            }
            divInfoContent.appendChild(table);
            divInfoContainer.appendChild(divInfoContent);
            valueField.appendChild(divInfoContainer);
        }
    }
}

//query the person or place layer to get details of particular person or place while adding new service request or showing general info
function ShowDetailsInfo(evt) {
    HideCommentsContainer();
    HideCreateRequestContainer();
    map.infoWindow.hide();
    var title = '';
    if (dojo.string.substitute(personLayer.Title, evt.graphic.attributes).trim() != ":") {
        title = dojo.string.substitute(personLayer.Title, evt.graphic.attributes);
    }
    else {
        title = showNullValueAs;
    }

    var queryTask = new esri.tasks.QueryTask(personLayer.QueryURL);
    var query = new esri.tasks.Query();
    var condition = dojo.string.substitute(personLayer.WhereQuery, evt.graphic.attributes);
    query.where = condition;
    query.outFields = [personLayer.OutFields];

    queryTask.execute(query, function (features) {
        var windowPoint = evt.mapPoint;

        if (features.features.length > 0) {
            for (var key in features.features[0].attributes) {
                if (!evt.graphic.attributes[key]) {
                    evt.graphic.attributes[key] = features.features[0].attributes[key];
                }
            }
        }
        else {
            var outfields = query.outFields[0].split(",");
            for (var key in outfields) {
                if (!evt.graphic.attributes[outfields[key]]) {
                    evt.graphic.attributes[outfields[key]] = showNullValueAs;
                }
            }
        }
        if (evt.graphic.geometry.type == "point") {
            map.setExtent(GetBrowserMapExtent(evt.mapPoint));
        }
        else {
            map.setExtent(GetBrowserMapExtent(evt.graphic.geometry.getExtent().getCenter()));
        }

        setTimeout(function () {
            if (isSubmitDisabled) {
                selectedGraphics = evt.mapPoint;
                ServiceRequestInfo(evt.graphic.attributes, title, null, windowPoint);
            }
            else {
                selectedGraphics = evt.mapPoint;
                SelectedId = dojo.string.substitute(operationalLayersCollection[0].ShareFields, evt.graphic.attributes);
                CreateDetails(evt.graphic.attributes, dojo.byId("divPersonDetails"));
                ShowInfoWindow(windowPoint, title, dojo.byId('divDetailsInfo'), dojo.byId("detailsInfoTitle"));
            }

        }, 500);
        HideLoadingMessage();
    }, function (err) {

    });
    evt = (evt) ? evt : event;
    evt.cancelBubble = true;
    if (evt.stopPropagation) evt.stopPropagation();
}

//show info-window and set header title
function ShowInfoWindow(windowPoint, title, detailsContainer, headerContainer) {
    detailsContainer.style.display = "block";
    headerContainer.innerHTML = title.trimString(35);
    map.infoWindow.resize(infoPopupWidth, infoPopupHeight);
    var screenPoint = map.toScreen(windowPoint);
    screenPoint.y = map.height - screenPoint.y;
    setTimeout(function () {
        map.infoWindow.show(screenPoint);
    }, 500);
}

//get extent based on map point
function GetBrowserMapExtent(mapPoint) {
    var width = map.extent.getWidth();
    var height = map.extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    var ymin = mapPoint.y - (height / 3);
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}
