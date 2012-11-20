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
var mapPoint;                   //Variable for storing map point location
var buildingCount;              //Variable for storing total building count
var arrBuilding = [];           //Variable for storing features grouped by building
var arrBuildingFloors = [];     //Variable for storing features grouped by building floors
var arrPlacesBySpaceType = [];  //Variable for storing places grouped by space types
var isShowingSearchResult = false;

function Locate() {
    var nodeBaseMap = dojo.byId('divBaseMapTitleContainer');
    if (nodeBaseMap.style.display != "none") {
        ShowHideBaseMapComponent();
    }
    var searchText = dojo.byId('txtAddress').value.trim();
    var query = new esri.tasks.Query();
    query.outSpatialReference = map.spatialReference;
    query.returnGeometry = true;
    var queryTask;
    if (searchText != '') {
        ShowLoadingMessage('Searching...');
        map.infoWindow.hide();
        if (dojo.byId('imgPersonSearch').checked) {     //Person search is selected
            queryTask = new esri.tasks.QueryTask(personLayer.QueryUrl);
            var queryFields = personLayer.QueryFields.split(',');
            var whereClause = '';
            if (searchText.lastIndexOf(' ') > 0) {
                for (var index in queryFields) {
                    var name = (index == 0) ? searchText.substr(0, searchText.lastIndexOf(' ')) : searchText.substr(searchText.lastIndexOf(' ') + 1);
                    whereClause += "UPPER(" + queryFields[index] + ") LIKE '" + name.toUpperCase() + "%' OR ";
                }
            }
            else {
                for (var index in queryFields) {
                    whereClause += "UPPER(" + queryFields[index] + ") LIKE '" + searchText.toUpperCase() + "%' OR ";
                }
            }

            whereClause = whereClause.slice(0, whereClause.length - 3);
            query.where = whereClause;
            query.outFields = [personLayer.OutFields];
            queryTask.execute(query, PopulatePersons, function (err) {
                ShowDialog('Error', err.message);
                HideLoadingMessage();
            });
        }
        else {                                          //Place search is selected
            queryTask = new esri.tasks.QueryTask(placeLayer.QueryUrl);
            var queryFields = placeLayer.QueryFields.split(',');
            var whereClause = '';
            for (var index in queryFields) {
                whereClause += "UPPER(" + queryFields[index] + ") LIKE '%" + searchText.toUpperCase() + "%' OR ";
            }
            whereClause = whereClause.slice(0, whereClause.length - 3);
            query.where = whereClause;
            query.outFields = [placeLayer.OutFields];
            queryTask.execute(query, GroupPlacesBySpaceType, function (err) {
                ShowDialog('Error', err.message);
                HideLoadingMessage();
            });
        }
    }
    else {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
        ShowDialog('Error', messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
    }
}

//function to sort features by name
function SortByName(a, b) {
    var x = a.attributes.FIRSTNAME + " " + a.attributes.LASTNAME;
    var y = b.attributes.FIRSTNAME + " " + b.attributes.LASTNAME;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}

function PopulatePersons(featureSet) {
    var features = featureSet.features;
    var ieVersion = getInternetExplorerVersion();
    features.sort(SortByName);
    if (features.length > 0) {
        RemoveChildren(dojo.byId('divAddressContainer'));
        var table = document.createElement("table");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.className = "tbl7";
        table.id = "tbl";
        if (ieVersion.toString() == "7") {          //Patch for fixing overflow-x issue in compatibility mode.
            table.style.width = "100%";
            table.style.overflowX = "hidden";
        }
        table.cellSpacing = 0;
        table.cellPadding = 0;

        var resultsCounter = 0;
        var feature;

        for (var i = 0; i < features.length; i++) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.innerHTML = features[i].attributes["FIRSTNAME"] + " " + features[i].attributes["LASTNAME"];
            if (td1.innerHTML.toLowerCase() == dojo.byId('txtAddress').value.trim().toLowerCase()) {
                resultsCounter++;
                feature = featureSet.features[i];
            }
            td1.className = 'tdAddress';
            td1.height = 20;
            td1.id = i;
            td1.title = 'Click to Locate';
            td1.onclick = function () {
                QueryRelatedRecords(featureSet.features[this.id]);
                WipeOutControl(dojo.byId('divAddressContainer'), 500);
                dojo.byId('txtAddress').value = this.innerHTML;
            }
            tr.appendChild(td1);
        }

        if (resultsCounter == 1) {
            RemoveChildren(dojo.byId('divAddressContainer'));
            QueryRelatedRecords(feature);
            HideLoadingMessage();
            return;
        }

        AnimateAdvanceSearch();
        var scrollbar_container = document.createElement('div');
        scrollbar_container.id = "address_container";
        // scrollbar_container.className = "scrollbar_container";
        scrollbar_container.className = "add_scrollbar_container";

        var container = document.createElement("div");
        container.id = "address_content";
        //  container.className = 'scrollbar_content';
        container.className = 'add_scrollbar_content';
        container.appendChild(table);

        scrollbar_container.appendChild(container);
        dojo.byId('divAddressContainer').appendChild(scrollbar_container);
        CreateScrollbar(scrollbar_container, container);
    }
    else {
        ShowDialog('Error', messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }
    HideLoadingMessage();
}

function QueryRelatedRecords(feature) {
    var relationQuery = new esri.tasks.RelationshipQuery();
    relationQuery.objectIds = [feature.attributes.OBJECTID];
    relationQuery.outFields = ["*"];
    relationQuery.relationshipId = 0;
    relationQuery.returnGeometry = true;

    var queryTask = new esri.tasks.QueryTask(personLayer.QueryUrl);
    queryTask.executeRelationshipQuery(relationQuery, function (result) {
        if (!result[feature.attributes.OBJECTID]) {
            ShowDialog('Error', dojo.byId('txtAddress').value + messages.getElementsByTagName("noLocationDet")[0].childNodes[0].nodeValue);
            return;
        }
        var features = result[feature.attributes.OBJECTID].features[0];

        for (var attribute in feature.attributes) {
            features.attributes[attribute] = feature.attributes[attribute];
        }

        ShowSpaceFeature(features, personLayer);
    }, function (err) {
        ShowDialog('Error', messages.getElementsByTagName("noFeatureFound")[0].childNodes[0].nodeValue);
    });
}

function GroupPlacesBySpaceType(featureSet) {
    var features = featureSet.features;
    arrPlacesBySpaceType = [];
    arrSortedSpaceType = [];
    for (var i = 0; i < features.length; i++) {
        if (arrPlacesBySpaceType[features[i].attributes.SPACETYPE]) {
            arrPlacesBySpaceType[features[i].attributes.SPACETYPE].push(features[i]);
        }
        else {
            arrPlacesBySpaceType[features[i].attributes.SPACETYPE] = [];
            arrPlacesBySpaceType[features[i].attributes.SPACETYPE].push(features[i]);
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
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
        ShowDialog('Error', messages.getElementsByTagName("noResultFound")[0].childNodes[0].nodeValue);
    }
    HideLoadingMessage();
}

function SortJSONData(arrPlacesBySpaceType) {
    var sorted = {}, key, a = [];

    for (key in arrPlacesBySpaceType) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }
}

function PopulatePlacesInGroup(arrSpaceTypes) {
    RemoveChildren(dojo.byId('divAddressContainer'));
    var ieVersion = getInternetExplorerVersion();
    var table = document.createElement("table");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.className = "tbl7";
    table.id = "tbl";
    if (ieVersion.toString() == "7") {          //Patch for fixing overflow-x issue in compatibility mode.
        table.style.width = "100%";
        table.style.overflowX = "hidden";
    }
    table.cellSpacing = 0;
    table.cellPadding = 0;


    for (var spaceType in arrSpaceTypes) {
        if (arrSpaceTypes[spaceType].length > 0) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            tr.appendChild(td1);
            var tNode = document.createTextNode(spaceType + " (" + arrSpaceTypes[spaceType].length + ")");
            td1.appendChild(tNode);
            td1.className = 'tdAddress';
            td1.height = 20;
            td1.id = 'td-' + spaceType;

            var tbl = document.createElement("table");
            var tBodySub = document.createElement("tbody");
            tbl.appendChild(tBodySub);
            tbl.id = spaceType;
            tbl.style.display = 'none';
            if (ieVersion.toString() == "7") {          //Patch for fixing overflow-x issue in compatibility mode.
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
                td2.innerHTML = arrSpaceTypes[spaceType][space].attributes["SPACEID"];
                td2.title = 'Click to Locate';
                td2.onclick = function (evt) {
                    evt = (evt) ? evt : event;
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    WipeOutControl(dojo.byId('divAddressContainer'), 500);
                    dojo.byId('txtAddress').value = arrSpaceTypes[this.id.split('-')[0]][this.id.split('-')[1]].attributes.SPACEID;
                    ShowSpaceFeature(arrSpaceTypes[this.id.split('-')[0]][this.id.split('-')[1]], placeLayer);
                }
            }
            td1.appendChild(tbl);
            td1.onclick = function () {
//                var topPos = dojo.coords(dojo.byId('address_containerscrollbar_handle')).t;
//                ToggleGroupDisplay(this.id);
//                dojo.byId('address_containerscrollbar_handle').style.top = '0px';
//                if (topPos > 5) {
//                    dojo.byId('address_containerscrollbar_handle').style.top = (topPos - 5) + 'px';
//                }
//                else {
//                    dojo.byId('address_containerscrollbar_handle').style.top = topPos + "px";
//                }

                var topPos = dojo.coords(dojo.byId('address_containerscrollbar_handle')).t;
                ToggleGroupDisplay(this.id);
                dojo.byId('address_containerscrollbar_handle').style.top = topPos + 'px';

            }
        }
    }
    AnimateAdvanceSearch();
    var scrollbar_container = document.createElement('div');
    scrollbar_container.id = "address_container";
    scrollbar_container.className = "add_scrollbar_container";

    var container = document.createElement("div");
    container.id = "address_content";
    container.className = 'add_scrollbar_content';
    container.appendChild(table);

    scrollbar_container.appendChild(container);
    dojo.byId('divAddressContainer').appendChild(scrollbar_container);
    CreateScrollbar(scrollbar_container, container);
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
    CreateScrollbar(dojo.byId('address_container'), dojo.byId('address_content'));
}

function ShowSpaceFeature(feature, layerInfo) {
    ClearGraphics();
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

    var queryTask = new esri.tasks.QueryTask(personLayer.QueryUrl);
    var query = new esri.tasks.Query();
    var condition = dojo.string.substitute(personLayer.WhereQuery, feature.attributes);
    query.where = condition;
    query.outFields = [personLayer.OutFields];

    queryTask.execute(query, function (features) {
        for (var att in feature.attributes) {
            if (!feature.attributes[att]) {
                feature.attributes[att] = 'N/A';
            }
        }

        if (features.features.length > 0) {
            for (var att in features.features[0].attributes) {
                if (!features.features[0].attributes[att]) {
                    features.features[0].attributes[att] = 'N/A';
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
        if ((feature.attributes["SPACETYPE"] == "N/A") && (feature.attributes["SPACEID"] == "N/A")) {
            title = 'N/A';
            truncateContent = true;
        }
        else {
            title = dojo.string.substitute(layerInfo.Title, feature.attributes);
        }
        map.setExtent(feature.geometry.getExtent().expand(2));
        //map.centerAt(feature.geometry.getExtent().getCenter());
        var contentDiv = CreateInfoWindowContent(feature, layerInfo, truncateContent);

        setTimeout(function () {
            var windowPoint
            if (feature.geometry.contains(feature.geometry.getExtent().getCenter())) {
                windowPoint = feature.geometry.getExtent().getCenter();
            }
            else {
                windowPoint = feature.geometry.getPoint(0, 0);

            }

            if (truncateContent) {
                var width = parseInt(layerInfo.InfoWindowSize.split(',')[0]);
                var height = parseInt(layerInfo.InfoWindowSize.split(',')[1]);
                height = height - 60;
                var size = width + "," + height;
                ShowInfoWindow(windowPoint, title, contentDiv, size);
            }
            else {
                if (layerInfo.Key == "PlaceLayer" && dijit.byId('btnRequest').attr('checked')) {
                    ServiceRequestInfo(null, title, contentDiv, windowPoint);
                }
                else {
                    ShowInfoWindow(windowPoint, title, contentDiv, layerInfo.InfoWindowSize);
                }
            }
        }, 1000);

    }, function (err) {

    });
}

function CreateInfoWindowContent(feature, layerInfo, truncateContent) {
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
            else {
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
    return divInfoContainer;
}

function ShowError(err) {
    ShowDialog('Error', err.message);
    HideLoadingMessage();
}

function ToggleSearch(control) {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }

    if (control.id == 'imgPlaceSearch') {
        //dojo.byId('imgPersonSearch').className = 'disabledText';
        dojo.byId('spanPlaceAddress').className = 'text';
        dojo.byId('spanPersonAddress').className = 'disabledText';
        dojo.byId('txtAddress').value = '';
        dojo.byId('txtAddress').setAttribute('placeholder', placeText);
    }
    else if (control.id == 'imgPersonSearch') {
        //dojo.byId('imgPlaceSearch').className = 'disabledText';
        dojo.byId('spanPlaceAddress').className = 'disabledText';
        dojo.byId('spanPersonAddress').className = 'text';
        dojo.byId('txtAddress').value = '';
        dojo.byId('txtAddress').setAttribute('placeholder', personText);
    }
}

function Toggle(control) {
    if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
        WipeOutControl(dojo.byId('divAddressContainer'), 500);
    }

    if (control.id == 'spanPlaceAddress') {
        dojo.byId('imgPlaceSearch').checked = true;
        dojo.byId('imgPlaceSearch').className = 'text';
        //  dojo.byId('imgPersonSearch').className = 'disabledText';
        dojo.byId('spanPlaceAddress').className = 'text';
        dojo.byId('spanPersonAddress').className = 'disabledText';
        dojo.byId('txtAddress').value = '';
        dojo.byId('txtAddress').setAttribute('placeholder', placeText);
    }
    else if (control.id == 'spanPersonAddress') {
        dojo.byId('imgPersonSearch').checked = true;
        dojo.byId('imgPersonSearch').className = 'text';
        //dojo.byId('imgPlaceSearch').className = 'disabledText';
        dojo.byId('spanPlaceAddress').className = 'disabledText';
        dojo.byId('spanPersonAddress').className = 'text';
        dojo.byId('txtAddress').value = '';
        dojo.byId('txtAddress').setAttribute('placeholder', personText);
    }
}

function OnloadFloors() {
    var queryTask = new esri.tasks.QueryTask(queryTaskUrl);
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
                        if (arrBuilding[fset.features[i].attributes.BUILDINGKEY]) {
                            arrBuilding[fset.features[i].attributes.BUILDINGKEY].push({ id: fset.features[i].attributes.FLOOR, feature: fset.features[i] });
                        }
                        else {
                            arrBuilding[fset.features[i].attributes.BUILDINGKEY] = [];
                            arrBuilding[fset.features[i].attributes.BUILDINGKEY].push({ id: fset.features[i].attributes.FLOOR, feature: fset.features[i] });
                            buildingCount++;
                        }
                    }

                    if (!defaultBuilding) {
                        defaultBuilding = fset.features[0].attributes.BUILDINGKEY;
                    }

                    if (floorSwitcher.IsExpressVisible && !floorSwitcher.IsAccordionVisible) {
                        InitializeSpinner(arrBuilding[defaultBuilding], defaultFloor);
                        SelectFeatures(defaultBuilding, defaultFloor);
                    }
                    if (floorSwitcher.IsAccordionVisible && !floorSwitcher.IsExpressVisible) {
                        CreateFloorSwitcher(arrBuilding, defaultBuilding, defaultFloor);
                        LocateBuildingFloors(arrBuilding[defaultBuilding], defaultFloor);
                    }
                    if (floorSwitcher.IsAccordionVisible && floorSwitcher.IsExpressVisible) {
                        InitializeSpinner(arrBuilding[defaultBuilding], defaultFloor);
                        CreateFloorSwitcher(arrBuilding, defaultBuilding, defaultFloor);
                        LocateBuildingFloors(arrBuilding[defaultBuilding], defaultFloor);
                    }

                    HideLoadingMessage();
                }
                else {
                    ShowDialog('Error', messages.getElementsByTagName("noBuildingFound")[0].childNodes[0].nodeValue);
                    HideLoadingMessage();
                }
            },
            function (err) {
                ShowDialog('Error', err.message);
                HideLoadingMessage();
            });
}

function CreateSubmitServiceRequestTabContainer(evt, searchContent) {
    var floorLayer = map.getLayer(queryGraphicLayer);
    if (dijit.byId('detailsContainer')) {
        dijit.byId('detailsContainer').destroyRecursive();
    }

    var tabContainer = document.createElement('div');
    tabContainer.id = 'divTab';
    var tabPan = document.createElement('div');
    tabPan.id = 'divPan';

    var tabs = new dijit.layout.TabContainer({
        id: "detailsContainer",
        style: "width: 301px; height:260px; ",
        tabPosition: "bottom"
    }, dojo.byId('divTab'));

    if (evt) {
        var detailsTab = new dijit.layout.ContentPane({
            id: "detailsContentPane",
            title: "<span style='font-size:12px;'><b>Details</b></span>",
            style: "overflow:hidden; height:260px; background-color:#474747;",
            content: CreateDetails(evt)
        }, dojo.byId('divPan'));
        tabs.addChild(detailsTab);
    }
    else {
        var detailsTab = new dijit.layout.ContentPane({
            id: "detailsContentPane",
            title: "<span style='font-size:12px;'><b>Details</b></span>",
            style: "overflow:hidden; height:260px; background-color:#474747;",
            content: searchContent
        }, dojo.byId('divPan'));
        tabs.addChild(detailsTab);
    }
    dojo.connect(detailsTab, "onShow", function () {
        if (dojo.byId("detailsContentPane")) {
            dojo.byId("detailsContentPane").focus();
        }
    });
    var submitRequestTab = new dijit.layout.ContentPane({
        title: "<span style='font-size:12px;'><b>Submit Request</b></span>",
        style: "height:260px; background-color:#474747;",
        content: ShowSubmitRequestForm()
    }, dojo.byId('divPan'));
    tabs.addChild(submitRequestTab);

    //    dojo.connect(submitRequestTab, "onShow", function (child) {
    //        CreateScrollbar(dojo.byId('divSubmitRequestContainer'), dojo.byId('divServiceRequestDetails'));
    //    });
    tabs.startup();
    return tabs;
}

function ShowSubmitRequestForm() {
    var divSubmitRequestContainer = document.createElement('div');
    divSubmitRequestContainer.id = 'divSubmitRequestContainer';
    divSubmitRequestContainer.className = 'divSubmitRequestContainer';

    var divSubmitRequest = CreateServiceRequestForm();
    divSubmitRequest.className = 'divServiceRequestDetails';
    divSubmitRequestContainer.appendChild(divSubmitRequest);

    return divSubmitRequestContainer;
}

function CreateServiceRequestForm() {
    if (dijit.byId('cbRequestType')) {
        dijit.byId('cbRequestType').destroy();
    }
    if (dijit.byId('btnSubmit')) {
        dijit.byId('btnSubmit').destroy();
    }
    if (dijit.byId('btnClear')) {
        dijit.byId('btnClear').destroy();
    }

    var divServiceRequestDetails = document.createElement('div');
    divServiceRequestDetails.id = 'divServiceRequestDetails';

    var tableServiceRequestDetails = document.createElement('table');
    tableServiceRequestDetails.id = 'tableServiceRequestDetails';
    divServiceRequestDetails.appendChild(tableServiceRequestDetails);
    tableServiceRequestDetails.style.width = '100%';
    tableServiceRequestDetails.style.height = '100%';
    tableServiceRequestDetails.style.display = 'block';
    tableServiceRequestDetails.cellPading = 0;
    tableServiceRequestDetails.cellSpacing = 0;

    var tbodyServiceRequestDetails = document.createElement('tbody');
    tableServiceRequestDetails.appendChild(tbodyServiceRequestDetails);

    var tr = document.createElement("tr");
    tr.style.height = "2px";
    tbodyServiceRequestDetails.appendChild(tr);

    var tr1 = document.createElement('tr');
    tr1.style.height = '25px';
    var td11 = document.createElement('td');
    td11.align = 'left';
    td11.vAlign = 'top';
    td11.style.color = '#ffffff';
    td11.style.width = '35%';
    td11.style.textIndent = "3px"
    td11.appendChild(document.createTextNode('Type:'));
    var td12 = document.createElement('td');
    td12.align = 'left';
    td12.vAlign = 'top';
    td12.style.width = '55%';
    var cbRequestType = document.createElement('input');
    td12.appendChild(cbRequestType);
    var filteringSelect = new dijit.form.ComboBox({
        autocomplete: true,
        hasdownarrow: true,
        filteringselect: true,
        id: 'cbRequestType',
        store: serviceRequestStore,
        style: "width: 195px; background-color: Black; color: White;",
        onChange: function () {
            ValidateRequestType();

        }

    }, cbRequestType); //options,elementID

    var td13 = document.createElement('td');
    td13.style.width = '10%';
    tr1.appendChild(td11);
    tr1.appendChild(td12);
    tr1.appendChild(td13);
    tbodyServiceRequestDetails.appendChild(tr1);

    var tr2 = document.createElement('tr');
    tr2.style.height = '53px';
    var td21 = document.createElement('td');
    td21.align = 'left';
    td21.vAlign = 'top';
    td21.style.textIndent = "3px"
    td21.appendChild(document.createTextNode('Description:'));
    var td22 = document.createElement('td');
    td22.align = 'left';
    td22.vAlign = 'top';
    var txtDescription = document.createElement('textarea');
    txtDescription.id = 'txtDescription';
    txtDescription.className = 'txtArea';
    td22.appendChild(txtDescription);
    tr2.appendChild(td21);
    tr2.appendChild(td22);
    tbodyServiceRequestDetails.appendChild(tr2);

    var tr3 = document.createElement('tr');
    tr3.style.height = '25px';
    var td31 = document.createElement('td');
    td31.align = 'left';
    td31.vAlign = 'top';
    td31.style.textIndent = "3px"
    td31.appendChild(document.createTextNode('Name:'));
    var td32 = document.createElement('td');
    td32.align = 'left';
    td32.vAlign = 'top';
    var txtName = document.createElement('input');
    txtName.id = 'txtName';
    txtName.className = 'txtBox';
    td32.appendChild(txtName);
    tr3.appendChild(td31);
    tr3.appendChild(td32);
    tbodyServiceRequestDetails.appendChild(tr3);

    var tr4 = document.createElement('tr');
    tr4.style.height = '25px';
    var td41 = document.createElement('td');
    td41.align = 'left';
    td41.vAlign = 'top';
    td41.style.textIndent = "3px"
    td41.appendChild(document.createTextNode('Email:'));
    var td42 = document.createElement('td');
    td42.align = 'left';
    td42.vAlign = 'top';
    var txtMail = document.createElement('input');
    txtMail.id = 'txtMail';
    txtMail.className = 'txtBox';
    td42.appendChild(txtMail);
    tr4.appendChild(td41);
    tr4.appendChild(td42);
    tbodyServiceRequestDetails.appendChild(tr4);

    var tr5 = document.createElement('tr');
    tr5.style.height = '25px';
    var td51 = document.createElement('td');
    td51.align = 'left';
    td51.vAlign = 'top';
    td51.style.textIndent = "3px"
    td51.appendChild(document.createTextNode('Phone:'));
    var td52 = document.createElement('td');
    td52.align = 'left';
    td52.vAlign = 'top';
    var txtPhone = document.createElement('input');
    txtPhone.id = 'txtPhone';
    txtPhone.className = 'txtBox';
    td52.appendChild(txtPhone);
    tr5.appendChild(td51);
    tr5.appendChild(td52);
    tbodyServiceRequestDetails.appendChild(tr5);

    var tr6 = document.createElement('tr');
    var td61 = document.createElement('td');
    td61.colSpan = 3;
    td61.style.height = '28px';
    td61.align = 'left';
    td61.style.textIndent = "3px"
    var spanServiceErrorMessage = document.createElement('span')
    spanServiceErrorMessage.id = 'spanServiceErrorMessage';
    spanServiceErrorMessage.style.color = 'Yellow';
    td61.appendChild(spanServiceErrorMessage);
    tr6.appendChild(td61);
    tbodyServiceRequestDetails.appendChild(tr6);

    var tr7 = document.createElement('tr');
    tr7.style.height = '30px';
    var tdBtn = document.createElement('td');
    tdBtn.colSpan = 3;
    tdBtn.align = 'center';
    var btnSubmit = document.createElement('BUTTON');
    btnSubmit.style.width = '100px';
    btnSubmit.appendChild(document.createTextNode('Submit'));

    var btnClear = document.createElement('BUTTON');
    btnClear.style.width = '100px';
    btnClear.appendChild(document.createTextNode('Cancel'));

    tdBtn.appendChild(btnSubmit);
    tdBtn.appendChild(btnClear);
    tr7.appendChild(tdBtn);
    tbodyServiceRequestDetails.appendChild(tr7);
    var submitWidget = new dijit.form.Button({
        id: 'btnSubmit',
        onClick: function () {
            CreateServiceRequest();
        }
    }, btnSubmit); //options,elementID
    var clearWidget = new dijit.form.Button({
        id: 'btnClear',
        onClick: function () {
            ResetRequestValues();
        }
    }, btnClear); //options,elementID

    return divServiceRequestDetails;
}

function ServiceRequestInfo(evt, title, searchContent, windowPoint) {
    if (evt) {
        if (evt.graphic.geometry.type == "point") {
            map.centerAt(evt.mapPoint);
        }
        else {
            map.setExtent(evt.graphic.geometry.getExtent().expand(1.5));
        }
    }
    var symbol = '';
    var graphic = '';
    if (dijit.byId('btnRequest').attr('checked')) {
        map.getLayer(tempServiceRequestLayerId).clear();
        ShowLoadingMessage('Locating...');
        symbol = new esri.symbol.PictureMarkerSymbol(serviceRequestSymbolURL, 25, 25);

        graphic = new esri.Graphic(windowPoint, symbol, null, null);
        map.getLayer(tempServiceRequestLayerId).add(graphic);
        HideLoadingMessage();
        ShowFeatureDetails(evt, title, searchContent, windowPoint);
    }
}

function ShowFeatureDetails(evt, title, searchContent, windowPoint) {
    if (title.length > 25) {
        map.infoWindow.setTitle("<span id='infoTitle' title='" + title + "'>" + title.trimString(25) + "</span>");
    }
    else {
        map.infoWindow.setTitle("<span id='infoTitle'>" + title + "</span>");
    }
    var infoWindowContent = CreateSubmitServiceRequestTabContainer(evt, searchContent);
    map.infoWindow.setContent(infoWindowContent.domNode);
    map.infoWindow.resize(310, 290);
    var wPoint = map.toScreen(windowPoint);
    setTimeout(function () {
        map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(wPoint));
        infoWindowContent.resize();
    }, 100);


}

//Function for displaying a particular floor in a building.
function LocateBuildingFloors(arrFloors, floorNo) {
    ClearGraphics();
    var floorImg = '';
    for (var floor in arrFloors) {
        var building = arrFloors[floor].feature.attributes.BUILDINGKEY;

        if (floorSwitcher.IsAccordionVisible)
            floorImg = dojo.byId(building + '-' + arrFloors[floor].id);
        if (arrFloors[floor].id == floorNo) {
            SelectFeatures(building, floorNo);

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

//function for displaying info window onclick of a map
function DoIdentify(evt) {
    map.infoWindow.hide();
    map.centerAt(evt.mapPoint);
    isShowingSearchResult = false;
    if (dijit.byId('btnRequest').attr('checked')) {

        var query = new esri.tasks.Query();
        query.geometry = evt.mapPoint;
        query.outFields = [serviceRequestLayerInfo.BuildingAttribute];
        query.returnGeometry = false;
        var queryTask = new esri.tasks.QueryTask(serviceRequestLayerInfo.BuildingFloorPlan);
        queryTask.execute(query, function (featureSet) {
            var attr = { "BUILDING": currentBuilding, "FLOOR": currentFloor, "SPACETYPE": "", "SPACEID": "", "SECTION": "" };
            if (featureSet.features.length == 0) {
                outsideServiceRequest = true;
                attr.BUILDING = outsideBuilding;
                attr.FLOOR = 1;
            }
            else if (featureSet.features.length > 0) {
                attr.BUILDING = featureSet.features[0].attributes[serviceRequestLayerInfo.BuildingAttribute];
                attr.FLOOR = 1;
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

function CreateDetails(evt) {
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
            table.appendChild(tBody);
            table.className = 'tblInfoWindow';
            table.cellSpacing = 0;
            table.cellPadding = 0;

            if (dijit.byId('btnRequest').attr('checked')) {
                var tr = document.createElement("tr");
                tr.style.height = "8px";
                tBody.appendChild(tr);
            }

            var attributes = evt.graphic.attributes;

            for (var att in attributes) {
                if (!attributes[att]) {
                    attributes[att] = 'N/A';
                }
            }

            var dateFields = operationalLayersCollectionRow.DateFields;
            for (var j = 0; j < dateFields.length; j++) {   //check for date type attributes and format date
                if (attributes[dateFields[j].ValueField]) {
                    var timeStamp = attributes[dateFields[j].ValueField];
                    attributes[dateFields[j].ValueField] = new Date(timeStamp).toDateString();
                }
            }

            for (var i in operationalLayersCollection[count].InfoPopupFieldsCollection) {
                var tr = document.createElement("tr");
                var td = document.createElement("td");
                td.className = 'tdDisplayField';
                td.innerHTML = operationalLayersCollection[count].InfoPopupFieldsCollection[i].DisplayText;
                td.vAlign = 'top';
                td.style.width = '40%';
                var td1 = document.createElement("td");
                td1.className = 'tdDisplayField';
                td1.vAlign = 'top';
                td1.style.width = '60%';

                if (operationalLayersCollection[count].InfoPopupFieldsCollection[i].isLink) {
                    var value = dojo.string.substitute(operationalLayersCollection[count].InfoPopupFieldsCollection[i].FieldName, attributes).trim();
                    if (value == "N/A") {
                        td1.innerHTML = showNullValueAs;
                    }
                    else {
                        var mailAnchor = document.createElement("a");
                        mailAnchor.className = 'mailAnchor';
                        mailAnchor.setAttribute("href", "mailto:" + value);
                        mailAnchor.appendChild(document.createTextNode(dojo.string.substitute(operationalLayersCollection[count].InfoPopupFieldsCollection[i].FieldName, attributes)));
                        td1.appendChild(mailAnchor);
                    }
                }
                else
                    if (dojo.string.substitute(operationalLayersCollection[count].InfoPopupFieldsCollection[i].FieldName, attributes).trim() != ":") {
                        var value = dojo.string.substitute(operationalLayersCollection[count].InfoPopupFieldsCollection[i].FieldName, attributes);
                        if (value == "N/A N/A" || value == "N/A") {
                            td1.innerHTML = showNullValueAs;
                        }
                        else {
                            td1.innerHTML = dojo.string.substitute(operationalLayersCollection[count].InfoPopupFieldsCollection[i].FieldName, attributes); ;
                        }
                    }

            tr.appendChild(td);
            tr.appendChild(td1);
            tBody.appendChild(tr);
        }
        divInfoContent.appendChild(table);
        divInfoContainer.appendChild(divInfoContent);
        return divInfoContainer;
    }
}
}

function ShowDetailsInfo(evt) {
    map.infoWindow.hide();
    console.log("Set Extent");
    if (evt.graphic.geometry.type == "point") {
        map.centerAt(evt.mapPoint);
    }
    else {
        map.setExtent(evt.graphic.geometry.getExtent().expand(1.5));
        map.centerAt(evt.graphic.geometry.getExtent().getCenter());
    }
    console.log("Before Extent change event " + map.extent.xmin + " " + map.extent.xmax + " " + map.extent.ymin + " " + map.extent.ymax);
    var handle = dojo.connect(map, "onExtentChange", function () {
        console.log("On Extent change complete " + map.extent.xmin + " " + map.extent.xmax + " " + map.extent.ymin + " " + map.extent.ymax);
        dojo.disconnect(handle);
        var title = '';
        if (dojo.string.substitute(operationalLayersCollection[0].Title, evt.graphic.attributes).trim() != ":") {
            title = dojo.string.substitute(operationalLayersCollection[0].Title, evt.graphic.attributes);
        }
        else {
            title = 'N/A';
        }

        var queryTask = new esri.tasks.QueryTask(personLayer.QueryUrl);
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
                map.centerAt(evt.mapPoint);
            }
            else {
                map.setExtent(evt.graphic.geometry.getExtent().expand(1.5));
                map.centerAt(evt.graphic.geometry.getExtent().getCenter());
            }
            setTimeout(function () {
                if (dijit.byId('btnRequest').attr('checked')) {
                    ServiceRequestInfo(evt, title, null, windowPoint);
                }
                else {
                    var obj = CreateDetails(evt);
                    ShowInfoWindow(windowPoint, title, obj, operationalLayersCollection[0].InfoWindowSize);
                }
            }, 500);
            HideLoadingMessage();
        }, function (err) {

        });
    });

    evt = (evt) ? evt : event;
    evt.cancelBubble = true;
    if (evt.stopPropagation) {
        evt.stopPropagation();
    }
}

//function for creating info window
function ShowInfoWindow(windowPoint, title, contentDiv, infoWindowSize) {
    if (title.length > 25) {
        map.infoWindow.setTitle("<span id='infoTitle' title='" + title + "'>" + title.trimString(25) + "</span>");
    }
    else {
        map.infoWindow.setTitle("<span id='infoTitle'>" + title + "</span>");
    }
    map.infoWindow.setContent(contentDiv);
    var wPoint = map.toScreen(windowPoint);

    map.infoWindow.show(windowPoint, map.getInfoWindowAnchor(wPoint));
    infoWindowSize = infoWindowSize.split(",");
    map.infoWindow.resize(Number(infoWindowSize[0]), Number(infoWindowSize[1]));
}