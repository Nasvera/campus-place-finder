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
var serviceRequestStore = '';      //Variable for storing service request types.

//Function to add service request layer on map
function AddServiceRequestLayerOnMap() {
    var serviceRequestLayer = new esri.layers.FeatureLayer(serviceRequestLayerInfo.ServiceUrl, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: [serviceRequestLayerInfo.OutFields],
        id: serviceRequestLayerInfo.Key,
        displayOnPan: false,
        visible: false
    });
    map.addLayer(serviceRequestLayer);

    dojo.connect(serviceRequestLayer, "onClick", function (evt) {
        map.infoWindow.hide();
        ShowServiceRequestDetails(evt.graphic.geometry, evt.graphic.attributes);
        //For cancelling event propagation
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
    });

    dojo.connect(serviceRequestLayer, "onSelectionComplete", function () {
        HideLoadingMessage();
    });
    dojo.connect(serviceRequestLayer, "onMouseOver", function (evt) {
        map.setMapCursor('pointer');
    });
    dojo.connect(serviceRequestLayer, "onMouseOut", function (evt) {
        map.setMapCursor('crosshair');
    });
    var serviceRequestLayerHandle = dojo.connect(serviceRequestLayer, "onSelectionComplete", function (features) {
        dojo.disconnect(serviceRequestLayerHandle);
        AddServiceLegendItem(serviceRequestLayer);
        PopulateRequestTypes(serviceRequestLayer.fields);
        HideLoadingMessage();
    });
    var serviceRequestCommentLayer = new esri.layers.FeatureLayer(serviceRequestLayerInfo.CommentsLayerURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: [serviceRequestLayerInfo.CommentsOutFields],
        id: serviceRequestLayerInfo.Key + "Comments"
    });
    map.addLayer(serviceRequestCommentLayer);
}

//function to showinfowindow
function ShowServiceRequestDetails(mapPoint, attributes) {
    infoWindowDescriptionFields = [];
    map.infoWindow.setTitle("<span id='spanInfoTitle' style='color:white; font-size:11px; font-weight:bolder; font-family:Verdana;'> Service Request ID: #" + attributes.REQUESTID + "</span> <span id='spanRequestId' style='display:none;'>" + attributes.REQUESTID + "</span>");
    var mainTabContainer = ShowServiceRequestTabContainer(attributes);
    map.infoWindow.setContent(mainTabContainer.domNode);
    var windowPoint = map.toScreen(mapPoint);
    map.infoWindow.resize(310, 295);
    setTimeout(function () {
        map.infoWindow.show(mapPoint, GetInfoWindowAnchor(windowPoint, 310));
        mainTabContainer.resize();
    }, 100);

    FetchRequestComments(attributes.REQUESTID);
    for (var index in infoWindowDescriptionFields) {
        CreateScrollbar(dojo.byId(index), dojo.byId(infoWindowDescriptionFields[index]));
    }

    RemoveChildren(dojo.byId("divAttachmentsData"));
    RemoveChildren(dojo.byId("divCommentsContent"));
    CreateRatingWidget(dojo.byId('commentRating'));

    ToggleCommentsView(false);
}

//function to fetch service request comments
function FetchRequestComments(requestID) {
    ShowDojoLoading(dojo.byId("divComments"));
    var query = new esri.tasks.Query();
    query.where = "REQUESTID = '" + requestID + "'";
    query.outFields = ["*"];
    for (var layerInfo in serviceRequestLayerInfo) {
        //execute query
        if (layerInfo == "CommentsLayerURL") {
            map.getLayer(serviceRequestLayerInfo["Key"] + "Comments").selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                dojo.byId('spanCommentsCount').innerHTML = features.length;
                var commentsTable = document.createElement("table");
                commentsTable.style.width = "90%";
                var commentsTBody = document.createElement("tbody");
                commentsTable.appendChild(commentsTBody);
                dojo.byId("divCommentsContent").appendChild(commentsTable);
                if (features.length > 0) {
                    features.sort(SortResultFeatures);      //function to sort comments based on submitted date
                    for (var i = 0; i < features.length; i++) {
                        var trComments = document.createElement("tr");
                        var commentsCell = document.createElement("td");
                        commentsCell.className = "bottomborder";
                        commentsCell.appendChild(CreateCommentRecord(features[i].attributes, i));
                        trComments.appendChild(commentsCell);
                        commentsTBody.appendChild(trComments);
                        CreateRatingWidget(dojo.byId('commentRating' + i));
                        SetRating(dojo.byId('commentRating' + i), features[i].attributes.RANK);
                    }
                }
                HideDojoLoading();
                CreateCommentsScrollBar();
            }, function (err) {
                HideDojoLoading();
            });
        }
    }
}

//function to create comment record
function CreateCommentRecord(attributes, i) {
    var table = document.createElement("table");
    table.style.width = "100%";
    var tbody = document.createElement("tbody");
    var tr = document.createElement("tr");
    tbody.appendChild(tr);

    var td = document.createElement("td");
    var td3 = document.createElement("td");
    td.innerHTML = "Importance: ";
    td.style.width = "25%";
    td3.appendChild(CreateRatingControl(true, "commentRating" + i, 0, 5));
    td3.style.width = "100px";
    var td1 = document.createElement("td");

    var date = new js.date();
    var utcMilliseconds = Number(attributes.SUBMITDT);
    td1.innerHTML = "Date: " + dojo.date.locale.format(date.utcToLocal(date.utcTimestampFromMs(utcMilliseconds)), { datePattern: "MMM dd, yyyy", selector: "date" });
    td1.style.width = "150px";

    tr.appendChild(td);
    tr.appendChild(td3);
    tr.appendChild(td1);

    var tr1 = document.createElement("tr");
    var td2 = document.createElement("td");
    var divComments = dojo.create("div", { "class": "wordBreakComments" }, td2);
    divComments.style.width = "270px";
    td2.colSpan = 3;
    if (attributes.COMMENTS) {
        divComments.innerHTML = attributes.COMMENTS;
    }
    else {
        divComments.innerHTML = showNullValueAs;
    }
    tr1.appendChild(td2);
    tbody.appendChild(tr1);

    table.appendChild(tbody);
    return table;
}

//function to add service request comment
function AddRequestComment() {
    var text = dojo.byId('txtComments').value.trim();
    if (text == "") {
        dojo.byId('txtComments').focus();
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("textComment")[0].childNodes[0].nodeValue);
        return;
    }
    if (text.length > 250) {
        dojo.byId('txtComments').focus();
        ShowSpanErrorMessage('spanCommentError', messages.getElementsByTagName("textCommentLimit")[0].childNodes[0].nodeValue);
        return;
    }
    ShowDojoLoading(dojo.byId("divComments"));
    var commentGraphic = new esri.Graphic();
    var date = new js.date();
    var attr = {
        "REQUESTID": dojo.byId('spanRequestId').innerHTML,
        "COMMENTS": text,
        "SUBMITDT": date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow())),
        "RANK": Number(dojo.byId('commentRating').value)
    };
    commentGraphic.setAttributes(attr);

    if (serviceRequestLayerInfo.CommentsLayerURL) {
        map.getLayer(serviceRequestLayerInfo.Key + "Comments").applyEdits([commentGraphic], null, null, function (msg) {
            if (msg[0].error) {
            }
            else {
                var table = dojo.query('table', dojo.byId("divCommentsContent"));
                if (table.length > 0) {
                    var tr = table[0].insertRow(0);
                    var commentsCell = document.createElement("td");
                    commentsCell.className = "bottomborder";
                    var index = dojo.query("tr", table[0]).length;
                    if (index) {
                        index = 0;
                    }
                    commentsCell.appendChild(CreateCommentRecord(attr, index));
                    tr.appendChild(commentsCell);
                    CreateRatingWidget(dojo.byId('commentRating' + index));
                    SetRating(dojo.byId('commentRating' + index), attr.RANK);
                    var query = new esri.tasks.Query();
                    query.where = "REQUESTID = '" + attr["REQUESTID"] + "'";
                    query.outFields = ["*"];
                    map.getLayer(serviceRequestLayerInfo.Key + "Comments").selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                        dojo.byId('spanCommentsCount').innerHTML = features.length;
                    });
                }
            }
            ToggleCommentsView(false);
            HideDojoLoading();
            CreateCommentsScrollBar();
        }, function (err) {
            HideDojoLoading();
        });
        ResetCommentFields();
    }
}

//Function for sorting comments according to date
function SortResultFeatures(a, b) {
    var x = a.attributes.SUBMITDT;
    var y = b.attributes.SUBMITDT;
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//function to create tab layout for Service request
function ShowServiceRequestTabContainer(attributes) {
    var tabContent = document.createElement('div');
    tabContent.id = 'tabContent';

    var dtlTab = new dijit.layout.ContentPane({
        title: "Details",
        content: CreateServiceRequestDetails(attributes)
    }, dojo.byId('tabContent'));


    var cmntTab = new dijit.layout.ContentPane({
        title: "Comments",
        content: CreateCommetsContainer()
    }, dojo.byId('tabContent'));

    dojo.connect(dtlTab, "onShow", function () {
        if (dojo.byId("commentsContainer")) {
            CreateScrollbar(dojo.byId("commentsContainer"), dojo.byId("commentsContent"));
        }
    });


    dojo.connect(cmntTab, "onShow", function () {
        CreateCommentsScrollBar();
    });

    var tabContainer = document.createElement('div');
    tabContainer.id = 'divTabContainer';
    var tabs = new dijit.layout.TabContainer({
        style: "width: 301px; height: 260px; vertical-align:middle;",
        tabPosition: "bottom"
    }, dojo.byId('divTabContainer'));
    tabs.addChild(dtlTab);
    tabs.addChild(cmntTab);
    tabs.startup();
    return tabs;
}

//function to create f
function CreateCommetsContainer() {
    var divComments = document.createElement("div");
    divComments.id = "divComments";
    divComments.style.overflow = "hidden";

    var divCommentInput = document.createElement("div");
    divCommentInput.id = "divCommentInput";
    var div = document.createElement("div");
    divCommentInput.appendChild(div);

    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.style.cursor = "pointer";
    table.style.fontSize = "10px";
    table.onclick = function () { ToggleCommentsView(true); };
    table.appendChild(tbody);
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.appendChild(CreateImage("images/addcomment.png", "", false, 30, 30));
    var td1 = document.createElement("td");
    td1.innerHTML = "Add Comment";
    tr.appendChild(td);
    tr.appendChild(td1);
    tbody.appendChild(tr);

    div.appendChild(table);

    var divCommentData = document.createElement("div");
    divCommentData.id = "divCommentData";
    divCommentData.style.height = "100%";
    divCommentData.style.width = "100%";
    divCommentData.style.fontSize = "10px";

    var table = document.createElement("table");
    table.style.width = "100%";
    tbody = document.createElement("tbody");
    table.appendChild(tbody);
    tr = document.createElement("tr");
    td = document.createElement("td");
    td.style.width = "50%";
    td.appendChild(document.createTextNode("Total Comments : "));
    var spanCommentsCount = document.createElement("span");
    spanCommentsCount.id = "spanCommentsCount";
    td.appendChild(spanCommentsCount);
    td1 = document.createElement("td");
    td1.appendChild(CreateRatingControl(true, "totalRating", 0, 5));
    tr.appendChild(td);
    tr.appendChild(td1);
    tbody.appendChild(tr);

    var divCommentsContainer = document.createElement("div");
    divCommentsContainer.id = "divCommentsContainer";
    divCommentsContainer.style.height = "160px";
    divCommentsContainer.style.width = "100%";
    divCommentsContainer.style.position = 'relative';

    var divCommentsContent = document.createElement("div");
    divCommentsContent.id = "divCommentsContent";
    divCommentsContent.style.overflow = "hidden";
    divCommentsContent.style.position = "absolute";
    divCommentsContent.style.height = "160px";


    divCommentsContainer.appendChild(divCommentsContent);

    divCommentData.appendChild(table);
    divCommentData.appendChild(divCommentsContainer);

    var divAddComment = document.createElement("div");
    divAddComment.id = "divAddComment";
    divAddComment.style.display = "none";
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);
    table.cellpadding = 1;
    table.cellspacing = 2;
    table.style.height = "100%";
    table.style.marginleft = "5px";
    table.style.fontSize = "10px";

    tr = document.createElement("tr");
    td = document.createElement("td");
    td.innerHTML = "Rating:";
    td1 = document.createElement("td");
    td1.appendChild(CreateRatingControl(false, "commentRating", 0, 5));
    tr.appendChild(td);
    tr.appendChild(td1);
    tbody.appendChild(tr);

    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.appendChild(document.createTextNode("Comment:"));
    tr.appendChild(td);
    tbody.appendChild(tr);

    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.appendChild(CreateTextArea("txtComments", "275px", "35px", "txtArea"));
    tr.appendChild(td);
    tbody.appendChild(tr);
    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.style.height = "20px";
    var spanCommentError = document.createElement("span");
    spanCommentError.id = "spanCommentError";
    spanCommentError.style.color = "Yellow";
    spanCommentError.style.display = "block";
    td.appendChild(spanCommentError);
    tr.appendChild(td);
    tbody.appendChild(tr);
    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.appendChild(CreateCommentAddTable());
    td.align = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    divAddComment.appendChild(table);

    divComments.appendChild(divCommentInput);
    divComments.appendChild(divCommentData);
    divComments.appendChild(divAddComment);
    return divComments;
}

//function to create save and cancel button layout
function CreateCommentAddTable() {
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.align = "right";
    var spanSubmit = document.createElement("span");
    spanSubmit.className = "rounded";
    spanSubmit.innerHTML = "Submit";
    spanSubmit.onclick = function () { AddRequestComment(); };
    td.appendChild(spanSubmit);

    var td1 = document.createElement("td");
    td1.align = "left";
    var spanCancel = document.createElement("span");
    spanCancel.className = "rounded";
    spanCancel.innerHTML = "Cancel";
    spanCancel.onclick = function () { ToggleCommentsView(false); };
    td1.appendChild(spanCancel);

    tr.appendChild(td);
    tr.appendChild(td1);
    tbody.appendChild(tr);
    return table;
}

//function to create servicerequest details
function CreateServiceRequestDetails(attributes) {
    var divDetailsContainer = document.createElement("div");
    divDetailsContainer.id = "divDetailsContainer";
    divDetailsContainer.className = "scrollbar_container";
    divDetailsContainer.style.height = "200px";
    var divDeatilsContent = document.createElement("div");
    divDeatilsContent.id = "divDeatilsContent";
    divDeatilsContent.className = "scrollbar_content";
    divDeatilsContent.style.height = "200px";
    divDetailsContainer.appendChild(divDeatilsContent);
    var table = document.createElement("table");
    divDeatilsContent.appendChild(table);

    table.cellspacing = 2;
    table.cellpadding = 1;
    table.style.fontSize = "11px";
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    var infoFields = serviceRequest.InfoPopupFieldsCollection;

    for (var index in infoFields) {
        if (attributes == null) {
            infoFields[index].FieldName = showNullValueAs;
        }
        if (infoFields[index].DataType == 'description') {
            tr = document.createElement("tr");
            td1 = document.createElement("td");
            td1.innerHTML = infoFields[index].DisplayText;
            td1.style.height = "15px";
            td1.colSpan = 2;

            var divDescriptionContainer = document.createElement("div");
            divDescriptionContainer.id = infoFields[index].id + "Container";
            divDescriptionContainer.style.height = "45px";
            divDescriptionContainer.style.position = "relative";
            divDescriptionContainer.style.border = "1px solid #fff";

            var divDescriptionContent = document.createElement("div");
            divDescriptionContent.id = infoFields[index].id + "Content";
            divDescriptionContent.style.height = '45px';
            divDescriptionContent.style.width = '95%';
            divDescriptionContent.style.position = "absolute";
            divDescriptionContent.style.overflow = "hidden";
            divDescriptionContent.className = "wordBreak";

            var spanRequestDesription = document.createElement("span");
            spanRequestDesription.id = "spanRequestDesription";
            spanRequestDesription.style.width = "260px";


            spanRequestDesription.innerHTML = dojo.string.substitute(infoFields[index].FieldName, attributes);

            divDescriptionContainer.appendChild(divDescriptionContent);
            divDescriptionContent.appendChild(spanRequestDesription);
            td1.appendChild(divDescriptionContainer);
            tr.appendChild(td1);
            tbody.appendChild(tr);
            infoWindowDescriptionFields[divDescriptionContainer.id] = divDescriptionContent.id;
        }
        else if (infoFields[index].DataType == 'date') {
            tr = document.createElement("tr");
            td = document.createElement("td");
            td.innerHTML = infoFields[index].DisplayText;
            td.style.height = "15px";
            td.style.width = '40%';

            td1 = document.createElement("td");
            td1.style.width = '40%';
            var spanRequestSubmittedDate = document.createElement("span");
            spanRequestSubmittedDate.id = "spanRequestSubmittedDate";

            var date = new js.date();
            var utcMilliseconds = Number(dojo.string.substitute(infoFields[index].FieldName, attributes));

            spanRequestSubmittedDate.innerHTML = dojo.date.locale.format(date.utcToLocal(date.utcTimestampFromMs(utcMilliseconds)), { datePattern: "MMM dd, yyyy", selector: "date" });
            td1.appendChild(spanRequestSubmittedDate);

            tr.appendChild(td);
            tr.appendChild(td1);
            tbody.appendChild(tr);
        }
        else {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            td.innerHTML = infoFields[index].DisplayText;
            td.style.height = '15px';
            td.style.width = '40%';
            var td1 = document.createElement('td');
            td1.className = "wordBreak";
            if (dojo.string.substitute(infoFields[index].FieldName, attributes) != "") {
                td1.innerHTML = dojo.string.substitute(infoFields[index].FieldName, attributes);
            }
            else {
                td1.innerHTML = showNullValueAs;
            }
            td1.style.width = '150px';
            tr.appendChild(td);
            tr.appendChild(td1);
            tbody.appendChild(tr);
        }
    }
    setTimeout(function () {
        CreateScrollbar(divDetailsContainer, divDeatilsContent);
    }, 1000);
    return divDetailsContainer;
}

//function to create scrollbar for comments
function CreateCommentsScrollBar() {

    CreateScrollbar(dojo.byId("commentsContainer"), dojo.byId("commentsContent"));
    CreateScrollbar(dojo.byId("divCommentsContainer"), dojo.byId("divCommentsContent"));
    ToggleCommentsView(false);
}


//Function for toggling comments view
function ToggleCommentsView(viewStatus) {
    if (viewStatus) {
        dojo.byId('divAddComment').style.display = 'block';
        dojo.byId('divCommentInput').style.display = 'none';
        dojo.byId('divCommentData').style.display = 'none';
        dojo.byId('txtComments').focus();

    }
    else {
        dojo.byId('divAddComment').style.display = 'none';
        dojo.byId('divCommentInput').style.display = 'block';
        dojo.byId('divCommentData').style.display = 'block';
    }
    ResetCommentFields();
}

//function to reset comments fields
function ResetCommentFields() {
    dojo.byId('txtComments').value = '';
    dojo.byId('spanCommentError').style.display = "none";
    SetRating(dojo.byId('commentRating'), 0);
}

//function to populate Service request types
function PopulateRequestTypes(serviceRequestLayerFields) {
    var serviceRequestFields
    for (var i = 0; i < serviceRequestLayerFields.length; i++) {
        if (serviceRequestLayerFields[i].name == serviceRequestLayerInfo.RequestTypeFieldName) {
            serviceRequestFields = serviceRequestLayerFields[i].domain.codedValues;
            break;
        }
    }

    var serviceRequestTypes = { identifier: "id", items: [] };
    for (var i = 0; i < serviceRequestFields.length; i++) {
        serviceRequestTypes.items[i] = { id: serviceRequestFields[i].name, name: serviceRequestFields[i].name };
    }
    serviceRequestStore = new dojo.data.ItemFileReadStore({ data: serviceRequestTypes });
}

//function to hide the Request service layer
function ToggleServiceRequestLayer() {
    if (map.getLayer(serviceRequestLayerInfo.Key)) {
        map.infoWindow.hide();
        if (dojo.coords(dojo.byId('divAddressContainer')).h > 0) {
            WipeOutControl(dojo.byId('divAddressContainer'), 500);
        }
        var divNode = dojo.byId('divBaseMapTitleContainer');
        if (dojo.coords(divNode).h > 0) {
            WipeOutControl(divNode, 500);
        }

        var serviceRequestLayer = map.getLayer(serviceRequestLayerInfo.Key);
        var query = new esri.tasks.Query();
        if (!dijit.byId('btnRequest').attr('checked')) {
            serviceRequestLayer.hide();
            map.getLayer(tempServiceRequestLayerId).clear();
            map.setMapCursor('default');
        }
        else {
            ShowLoadingMessage('Populating Service Requests...');
            query.where = dojo.string.substitute(serviceRequestLayerInfo.WhereQuery, [currentFloor, currentBuilding]);
            serviceRequestLayer.show();
            serviceRequestLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            map.setMapCursor('crosshair');
        }
    }
}

//function to add Service request legend items
function AddServiceLegendItem(layer) {
    if (!(dojo.isIE < 9)) {
        serviceRequestSymbolURL = layer.url + "/images/" + layer.renderer.infos[0].symbol.imageData;
    }
    else {
        serviceRequestSymbolURL = layer.renderer.infos[0].symbol.url;
    }
}

//function to reset values
function ResetRequestValues() {
    map.setMapCursor('crosshair');
    dijit.byId('cbRequestType').setValue("");
    dojo.byId('txtDescription').value = "";
    dojo.byId('txtName').value = "";
    dojo.byId('txtMail').value = "";
    dojo.byId('txtPhone').value = "";
    dojo.byId('spanServiceErrorMessage').innerHTML = "";
    dijit.byId('detailsContainer').selectChild(dijit.byId('detailsContentPane'));
}

//function to validate request type
function ValidateRequestType() {
    if (!dijit.byId('cbRequestType').item) {
        dijit.byId('cbRequestType').setValue("");
    }
}

//function to create service request
function CreateServiceRequest() {
    if (map.getLayer(tempServiceRequestLayerId).graphics.length == 0) {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("selectLocation")[0].childNodes[0].nodeValue);
        return false;
    }
    if (ValidateRequestData()) {
        ShowLoadingMessage("Creating Service Request...");
        var mapPoint = map.getLayer(tempServiceRequestLayerId).graphics[0].geometry;
        mapPoint.spatialReference = map.spatialReference;
        var date = new js.date();
        var serviceRequestAttributes = {
            "REQUESTTYPE": dijit.byId("cbRequestType").getValue(),
            "COMMENTS": dojo.byId('txtDescription').value.trim(),
            "NAME": dojo.byId('txtName').value.trim(),
            "PHONE": dojo.byId('txtPhone').value.trim(),
            "EMAIL": dojo.byId('txtMail').value.trim(),
            "STATUS": "Unassigned",
            "REQUESTDATE": date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow())),
            "BUILDING": currentBuilding,
            "FLOOR": currentFloor
        };

        if (outsideServiceRequest) {
            serviceRequestAttributes.BUILDING = outsideBuilding;
            serviceRequestAttributes.FLOOR = 1;
            currentFloor = 1;
        }

        var serviceRequestGraphic = new esri.Graphic(mapPoint, null, serviceRequestAttributes, null);
        map.getLayer(serviceRequestLayerInfo.Key).applyEdits([serviceRequestGraphic], null, null, function (addResults) {
            if (addResults[0].success) {
                var objectIdField = map.getLayer(serviceRequestLayerInfo.Key).objectIdField;
                var requestID = { "REQUESTID": String(addResults[0].objectId) };
                requestID[objectIdField] = addResults[0].objectId;
                var requestGraphic = new esri.Graphic(mapPoint, null, requestID, null);
                map.getLayer(serviceRequestLayerInfo.Key).applyEdits(null, [requestGraphic], null, function () {
                    serviceRequestGraphic.attributes["REQUESTID"] = String(addResults[0].objectId);
                    HideLoadingMessage();
                    map.infoWindow.hide();
                    ToggleServiceRequestLayer();
                    if (outsideServiceRequest) {
                        InitializeSpinner(arrBuilding[currentBuilding], 1);
                        CreateFloorSwitcher(arrBuilding, currentBuilding, 1);
                        LocateBuildingFloors(arrBuilding[currentBuilding], 1);
                    }

                    ShowDialog(messages.getElementsByTagName("serviceReqtId")[0].childNodes[0].nodeValue + serviceRequestGraphic.attributes["REQUESTID"], messages.getElementsByTagName("serviceReqtId")[0].childNodes[0].nodeValue + serviceRequestGraphic.attributes["REQUESTID"] + messages.getElementsByTagName("serviceReqIdSuccess")[0].childNodes[0].nodeValue);
                }, function (err) {
                    ResetRequestValues();
                    HideLoadingMessage();
                });
                map.getLayer(tempServiceRequestLayerId).clear();
            }
        }, function (err) {
            ResetRequestValues();
            HideLoadingMessage();
            map.getLayer(tempServiceRequestLayerId).clear();
        });
    }
}
//function to show infowindow with service request number
function ShowServiceRequestID(mapPoint, objectID) {
    map.infoWindow.setTitle("Service Request");
    var spanServiceRequestNumber = document.createElement("span");
    spanServiceRequestNumber.innerHTML = "Service Request Id : " + objectID;
    map.infoWindow.setContent(spanServiceRequestNumber);
    var windowPoint = map.toScreen(mapPoint);
    map.infoWindow.resize(250, 300);
    map.infoWindow.show(mapPoint, GetInfoWindowAnchor(windowPoint, 250));
}

function ValidateRequestData() {
    if (dijit.byId("cbRequestType").getValue() == "") {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgType")[0].childNodes[0].nodeValue);
        return false;
    }
    if (dojo.byId('txtDescription').value.trim().length > 0 && dojo.byId('txtDescription').value.trim().length > 255) {
        dojo.byId('txtDescription').focus();
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgLength")[0].childNodes[0].nodeValue);
        return false;
    }

    if (dojo.byId('txtName').value.trim() != 0) {
        if (dojo.byId('txtName').value.trim().length > 50) {
            dojo.byId('txtName').focus();
            ShowErrorMessage('spanServiceErrorMessage', messages.getElementsByTagName("exceededName")[0].childNodes[0].nodeValue);
            return;
        }
        if (!IsName(dojo.byId('txtName').value.trim())) {
            dojo.byId('txtName').focus();
            ShowErrorMessage('spanServiceErrorMessage', messages.getElementsByTagName("spanErrorMsgText")[0].childNodes[0].nodeValue);
            return;
        }
    }

    if (dojo.byId('txtMail').value.trim() == '' && dojo.byId('txtPhone').value.trim() == '') {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgPhoneEmail")[0].childNodes[0].nodeValue);
        return;
    }
    if (dojo.byId('txtPhone').value.trim() == '') {
        if (!CheckMailFormat(dojo.byId('txtMail').value.trim())) {
            dojo.byId('txtMail').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidEmail")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtMail').value.trim().length > 100) {
            dojo.byId('txtMail').focus();
            ShowErrorMessage('spanServiceErrorMessage', messages.getElementsByTagName("exceededMail")[0].childNodes[0].nodeValue);
            return;
        }
    }
    else if (dojo.byId('txtMail').value.trim() == '') {
        if (!IsPhoneNumber(dojo.byId('txtPhone').value.trim())) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtPhone').value.trim().length != 10) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgDigitPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    if (dojo.byId('txtMail').value.trim().length > 0) {
        if (!CheckMailFormat(dojo.byId('txtMail').value.trim())) {
            dojo.byId('txtMail').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidEmail")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtMail').value.trim().length > 100) {
            dojo.byId('txtMail').focus();
            ShowErrorMessage('spanServiceErrorMessage', messages.getElementsByTagName("exceededMail")[0].childNodes[0].nodeValue);
            return;
        }
    }
    if (dojo.byId('txtPhone').value.trim().length > 0) {
        if (!IsPhoneNumber(dojo.byId('txtPhone').value.trim())) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtPhone').value.trim().length != 10) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgDigitPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    return true;
}