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
var serviceRequestStore = '';      //Variable for storing service request types.
var requestId;   //Variable for storing service request ID.

//add service request layer on map
function AddServiceRequestLayerOnMap() {
    var serviceRequestLayer = new esri.layers.FeatureLayer(serviceRequestLayerInfo.ServiceURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: [serviceRequestLayerInfo.OutFields],
        id: serviceRequestLayerInfo.Key,
        displayOnPan: false,
        visible: false
    });
    map.addLayer(serviceRequestLayer);

    dojo.connect(serviceRequestLayer, "onClick", function (evt) {
        map.infoWindow.hide();
        HideCommentsContainer();
        HideDetailsInfo();
        HideCreateRequestContainer();
        ShowServiceRequestDetails(evt.graphic.geometry, evt.graphic.attributes);
        //cancel event propagation
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
    });
    dojo.connect(serviceRequestLayer, "onMouseOver", function (evt) {
        map.setMapCursor('pointer');
    });
    dojo.connect(serviceRequestLayer, "onMouseOut", function (evt) {
        map.setMapCursor('crosshair');
    });
    var serviceRequestLayerHandle = dojo.connect(serviceRequestLayer, "onSelectionComplete", function (features) {
        AddServiceLegendItem(serviceRequestLayer);
        PopulateRequestTypes(serviceRequestLayer.fields);
        HideLoadingMessage();
        dojo.disconnect(serviceRequestLayerHandle);
    });
    var serviceRequestCommentLayer = new esri.layers.FeatureLayer(serviceRequestLayerInfo.CommentsLayerURL, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: [serviceRequestLayerInfo.CommentsOutFields],
        id: serviceRequestLayerInfo.Key + "Comments"
    });
    map.addLayer(serviceRequestCommentLayer);
}

//show details of existing service request
function ShowServiceRequestDetails(mapPoint, attributes) {
    SelectedId = dojo.string.substitute(serviceRequestLayerInfo.ShareFields, attributes);
    infoWindowDescriptionFields = [];
    requestId = dojo.string.substitute(serviceRequestLayerInfo.RequestId, attributes);
    ShowServiceRequestTabContainer(attributes);
    selectedGraphics = mapPoint;
    map.setExtent(GetBrowserMapExtent(mapPoint));
    FetchRequestComments(dojo.string.substitute(serviceRequestLayerInfo.CommentId, attributes), attributes, mapPoint);
    RemoveChildren(dojo.byId("divAttachmentsData"));
    RemoveChildren(dojo.byId("divCommentsContent"));
    CreateRatingWidget(dojo.byId('commentRating'));
    ToggleCommentsView(false);
}

//fetch comments for service request
function FetchRequestComments(requestID, attributes, mapPoint) {
    var reqId;
    ShowDojoLoading(dojo.byId("divComments"));
    var query = new esri.tasks.Query();
    serviceRequestLayerInfo.CommentId.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
        reqId = key;
    });
    query.where = reqId + "= '" + requestID + "'";
    query.outFields = ["*"];
    for (var layerInfo in serviceRequestLayerInfo) {
        //execute query
        if (layerInfo == "CommentsLayerURL") {
            map.getLayer(serviceRequestLayerInfo["Key"] + "Comments").selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
                dojo.byId('spanCommentsCount').innerHTML = features.length;
                var commentsTable = document.createElement("table");
                commentsTable.style.width = "95%";
                commentsTable.style.paddingLeft = "5px";
                var commentsTBody = document.createElement("tbody");
                commentsTable.appendChild(commentsTBody);
                dojo.byId("divCommentsContent").appendChild(commentsTable);
                if (features.length > 0) {
                    features.sort(SortResultFeatures);      //sort comments based on submitted date
                    for (var i = 0; i < features.length; i++) {
                        var trComments = document.createElement("tr");
                        var commentsCell = document.createElement("td");
                        commentsCell.className = "bottomborder";
                        commentsCell.appendChild(CreateCommentRecord(features[i].attributes, i));
                        trComments.appendChild(commentsCell);
                        commentsTBody.appendChild(trComments);
                        CreateRatingWidget(dojo.byId('commentRating' + i));
                        SetRating(dojo.byId('commentRating' + i), dojo.string.substitute(commentsInfoPopupFieldsCollection.Rank, features[i].attributes));
                    }
                }
                setTimeout(function () {
                    ShowInfoWindow(mapPoint, "Service Request ID: #" + dojo.string.substitute(serviceRequestLayerInfo.RequestId, attributes), dojo.byId("divCommentsInfo"), dojo.byId("tdCommentsHeader"));
                }, 500);
                HideDojoLoading();
                CreateCommentsScrollBar();
            }, function (err) {
                HideDojoLoading();
            });
        }
    }
}

//create list of comments on service request
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
    var utcMilliseconds = Number(dojo.string.substitute(commentsInfoPopupFieldsCollection.SubmitDate, attributes));
    td1.innerHTML = "Date: " + dojo.date.locale.format(date.utcToLocal(date.utcTimestampFromMs(utcMilliseconds)), { datePattern: "MMM dd, yyyy", selector: "date" });
    td1.style.width = "150px";

    tr.appendChild(td);
    tr.appendChild(td3);
    tr.appendChild(td1);

    var tr1 = document.createElement("tr");
    var td2 = document.createElement("td");
    var divComments = dojo.create("div", { "class": "wordBreakComments" }, td2);
    divComments.style.width = (infoPopupWidth - 40) + "px";
    td2.colSpan = 3;

    if (dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)) {
        var wordCount = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/).length;
        if (wordCount > 1) {
            var value = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[0].length == 0 ? "<br>" : dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[0].trim();
            for (var c = 1; c < wordCount; c++) {
                var comment;
                if (value != "<br>") {
                    comment = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].trim().replace("", "<br>");
                } else {
                    comment = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].trim();
                }
                value += dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(/\n/)[c].length == 0 ? "<br>" : comment;
            }
        } else {
            value = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes);
        }
        divComments.innerHTML += value;
        if (CheckCommentMailFormat(dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)) || dojo.string.substitute(dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)).match("http:") || dojo.string.substitute(dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes)).match("https:")) {
            divComments.className = "wordBreak";
        } else {
            divComments.className = "tdBreak";
        }
        var x = dojo.string.substitute(commentsInfoPopupFieldsCollection.Comments, attributes).split(" ");
        for (var i in x) {
            w = x[i].getWidth(15) - 50;
            var boxWidth = infoPopupWidth - 40;
            if (boxWidth < w) {
                divComments.className = "wordBreak";
                continue;
            }
        }
    }
    else {
        divComments.innerHTML = showNullValueAs;
    }
    tr1.appendChild(td2);
    tbody.appendChild(tr1);

    table.appendChild(tbody);
    return table;
}

//Add service request comment
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
    var attr = {};
    attr[databaseFields.RequestIdFieldName] = requestId;
    attr[databaseFields.CommentsFieldName] = text;
    attr[databaseFields.DateFieldName] = date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
    attr[databaseFields.RankFieldName] = Number(dojo.byId('commentRating').value);

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
                    SetRating(dojo.byId('commentRating' + index), attr[databaseFields.RankFieldName]);
                    var query = new esri.tasks.Query();
                    var relationshipId;
                    serviceRequestLayerInfo.CommentId.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function (match, key) {
                        relationshipId = key;
                    });

                    query.where = relationshipId + " = '" + attr[databaseFields.RequestIdFieldName] + "'";
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

//Get width of a control when text and font size are specified
String.prototype.getWidth = function (fontSize) {
    var test = document.createElement("span");
    document.body.appendChild(test);
    test.style.visibility = "hidden";
    test.style.fontSize = fontSize + "px";
    test.innerHTML = this;
    var w = test.offsetWidth;
    document.body.removeChild(test);
    return w;
}

//Sort comments according to date
function SortResultFeatures(a, b) {
    var x = dojo.string.substitute(commentsInfoPopupFieldsCollection.SubmitDate, a.attributes);
    var y = dojo.string.substitute(commentsInfoPopupFieldsCollection.SubmitDate, b.attributes);
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
}

//Create tab layout for Service request
function ShowServiceRequestTabContainer(attributes) {
    CreateServiceRequestDetails(attributes);
    CreateCommetsContainer();
    dojo.byId("tdComments").style.display = "block";
    dojo.byId("tdSubmitedDetails").style.display = "none";
    dojo.byId("divCommentsDetails").style.display = "none";
    dojo.byId("divRequestInfo").style.display = "block";
    dojo.connect(dojo.byId("tdComments"), "onclick", function () {
        dojo.byId("tdComments").style.display = "none";
        dojo.byId("tdSubmitedDetails").style.display = "block";
        dojo.byId("divCommentsDetails").style.display = "block";
        dojo.byId("divRequestInfo").style.display = "none";
        CreateCommentsScrollBar();
    });

    dojo.connect(dojo.byId("tdSubmitedDetails"), "onclick", function () {
        dojo.byId("tdComments").style.display = "block";
        dojo.byId("tdSubmitedDetails").style.display = "none";
        dojo.byId("divCommentsDetails").style.display = "none";
        dojo.byId("divRequestInfo").style.display = "block";
    });
}

//Create comment container
function CreateCommetsContainer() {
    var divComments = document.createElement("div");
    divComments.id = "divComments";
    divComments.style.overflow = "hidden";
    dojo.byId("divCommentsDetails").appendChild(divComments);
    var divCommentInput = document.createElement("div");
    divCommentInput.id = "divCommentInput";

    var div = document.createElement("div");
    divCommentInput.appendChild(div);

    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.style.paddingLeft = "5px";
    table.style.cursor = "pointer";
    table.style.fontSize = "11px";
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
    divCommentData.style.fontSize = "11px";

    var table = document.createElement("table");
    table.style.width = "100%";
    table.style.paddingLeft = "5px";
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
    divCommentsContainer.style.height = (infoPopupHeight - 110) + "px";
    divCommentsContainer.style.width = "100%";
    divCommentsContainer.style.position = 'relative';

    var divCommentsContent = document.createElement("div");
    divCommentsContent.id = "divCommentsContent";
    divCommentsContent.style.overflow = "hidden";
    divCommentsContent.style.position = "absolute";
    divCommentsContent.style.height = (infoPopupHeight - 110) + "px";

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
    table.style.width = "98%";
    table.style.paddingLeft = "5px";

    tr = document.createElement("tr");
    var td = document.createElement("td");
    tr.appendChild(td);
    var table1 = document.createElement("table");
    var tbody1 = document.createElement("tbody");
    var tr1 = document.createElement("tr");
    td.appendChild(table1);
    table1.appendChild(tbody1);
    tbody1.appendChild(tr1);
    td = document.createElement("td");
    td.style.width = "60px";
    td.innerHTML = "Rating:";
    td1 = document.createElement("td");
    td1.appendChild(CreateRatingControl(false, "commentRating", 0, 5));
    tr1.appendChild(td);
    tr1.appendChild(td1);
    tbody.appendChild(tr);

    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.style.paddingLeft = "2px";
    td.appendChild(document.createTextNode("Comment:"));
    tr.appendChild(td);
    tbody.appendChild(tr);

    tr = document.createElement("tr");
    td = document.createElement("td");
    td.colSpan = 2;
    td.style.paddingTop = "5px";
    td.appendChild(CreateTextArea("txtComments", "95%", "100px", "txtArea"));
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
    tr.style.height = "25px";
    tbody.appendChild(tr);
    CreateCommentAddTable(tr, "comment");

    divAddComment.appendChild(table);

    divComments.appendChild(divCommentInput);
    divComments.appendChild(divCommentData);
    divComments.appendChild(divAddComment);
}

//Create dom node for "save and cancel button"
function CreateCommentAddTable(mainDiv, request, idSubmit, idCancel) {
    var td = document.createElement("td");
    td.style.width = "50%";
    mainDiv.appendChild(td);

    var outerDiv = document.createElement("div");
    td.appendChild(outerDiv);

    outerDiv.className = "customButton";
    if (idSubmit) {
        outerDiv.id = idSubmit;
    }
    outerDiv.style.width = "75px";
    td.align = "right";

    var innerDiv = document.createElement("div");
    innerDiv.className = "customButtonInner";

    outerDiv.appendChild(innerDiv);

    var table = document.createElement("table");
    table.style.width = "100%";
    table.style.height = "100%";

    innerDiv.appendChild(table);
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    var tr = document.createElement("tr");
    tbody.appendChild(tr);
    var td = document.createElement("td");
    td.align = "center";
    td.verticalAlign = "middle";
    td.innerHTML = "Submit";
    td.onclick = function () {
        if (request == "comment") {
            AddRequestComment();
        }
        else {
            CreateServiceRequest();
        }
    };
    tr.appendChild(td);
    var td1 = document.createElement("td");
    td1.style.width = "50%";
    mainDiv.appendChild(td1);

    var outerDiv1 = document.createElement("div");
    td1.appendChild(outerDiv1);
    outerDiv1.className = "customButton";
    if (idCancel) {
        outerDiv1.id = idCancel;
    }
    outerDiv1.style.width = "75px";
    td1.align = "left";

    var innerDiv1 = document.createElement("div");
    innerDiv1.className = "customButtonInner";
    innerDiv1.style.width = "75px";
    outerDiv1.appendChild(innerDiv1);

    var table1 = document.createElement("table");
    table1.style.width = "100%";
    table1.style.height = "100%";

    innerDiv1.appendChild(table1);
    var tbody1 = document.createElement("tbody");
    table1.appendChild(tbody1);

    var tr1 = document.createElement("tr");
    tbody1.appendChild(tr1);
    var td1 = document.createElement("td");
    td1.align = "center";
    td1.verticalAlign = "middle";
    tr1.appendChild(td1);
    td1.innerHTML = "Cancel";
    td1.onclick = function () {
        if (request == "comment") {
            ToggleCommentsView(false);
        }
        else {
            ResetRequestValues();
        }
    };
}

//Show service request details
function CreateServiceRequestDetails(attributes) {
    var divDetailsContainer = document.createElement("div");
    divDetailsContainer.id = "divDetailsContainer";
    divDetailsContainer.className = "scrollbar_container";
    divDetailsContainer.style.height = (infoPopupHeight - 40) + "px";
    dojo.byId("divRequestInfo").appendChild(divDetailsContainer);

    var divDeatilsContent = document.createElement("div");
    divDeatilsContent.id = "divDeatilsContent";
    divDeatilsContent.className = "scrollbar_content";
    divDeatilsContent.style.height = (infoPopupHeight - 40) + "px";
    divDetailsContainer.appendChild(divDeatilsContent);

    var table = document.createElement("table");
    divDeatilsContent.appendChild(table);

    table.cellspacing = 2;
    table.cellpadding = 1;
    table.style.fontSize = "11px";
    table.style.width = "98%";
    table.style.paddingLeft = "5px";
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
            td1.vAlign = "top";
            td1.innerHTML = infoFields[index].DisplayText;
            td1.style.width = "100px";
            var td2 = document.createElement("td");
            td2.id = infoFields[index].id + "Content";
            td2.className = "wordBreak";
            var spanRequestDesription = document.createElement("span");
            spanRequestDesription.id = "spanRequestDesription";
            spanRequestDesription.style.width = "90%";
            if (dojo.string.substitute(infoFields[index].FieldName, attributes) == "") {
                spanRequestDesription.innerHTML = showNullValueAs;
            }
            else {
                spanRequestDesription.innerHTML = dojo.string.substitute(infoFields[index].FieldName, attributes);
            }
            td2.appendChild(spanRequestDesription);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tbody.appendChild(tr);
            infoWindowDescriptionFields[td2.id] = td2.id;
        }
        else if (infoFields[index].DataType == 'date') {
            tr = document.createElement("tr");
            td = document.createElement("td");
            td.innerHTML = infoFields[index].DisplayText;
            td.style.height = "15px";
            td.style.width = '100px';
            td.vAlign = "top";
            td1 = document.createElement("td");
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
            td.style.width = '100px';
            td.vAlign = "top";
            var td1 = document.createElement('td');
            td1.className = "wordBreak";

            if (dojo.string.substitute(infoFields[index].FieldName, attributes) != "") {
                td1.innerHTML = dojo.string.substitute(infoFields[index].FieldName, attributes);
                if (infoFields[index].Email) {
                    td1.style.textDecoration = "underline";
                    td1.style.cursor = "pointer"
                    td1.setAttribute("email", dojo.string.substitute(infoFields[index].FieldName, attributes));
                    td1.onclick = function () {
                        (this.getAttribute("email") == null) ? "" : window.location = "mailto:" + this.getAttribute("email");
                    }
                }
            }
            else {
                td1.innerHTML = showNullValueAs;
            }
            tr.appendChild(td);
            tr.appendChild(td1);
            tbody.appendChild(tr);
        }
    }
    setTimeout(function () {
        CreateScrollbar(divDetailsContainer, divDeatilsContent);
    }, 2000);
}

//Create scrollbar for comment container
function CreateCommentsScrollBar() {
    CreateScrollbar(dojo.byId("divCommentsContainer"), dojo.byId("divCommentsContent"));
    ToggleCommentsView(false);
}

//Toggle comment view
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

//Reset comment fields
function ResetCommentFields() {
    dojo.byId('txtComments').value = '';
    dojo.byId('spanCommentError').style.display = "none";
    SetRating(dojo.byId('commentRating'), 0);
}

//Populate Service request types in drop down
function PopulateRequestTypes(serviceRequestLayerFields) {
    var serviceRequestFields;
    for (var i = 0; i < serviceRequestLayerFields.length; i++) {
        if (serviceRequestLayerFields[i].name.toLowerCase() == serviceRequestLayerInfo.RequestTypeFieldName.toLowerCase()) {
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

//Hide Service Request layer
function ToggleServiceRequestLayer() {
    if (map.getLayer(serviceRequestLayerInfo.Key)) {
        map.infoWindow.hide();
        selectedGraphics = null;
        var serviceRequestLayer = map.getLayer(serviceRequestLayerInfo.Key);
        var query = new esri.tasks.Query();
        if (isSubmitDisabled) {
            query.where = dojo.string.substitute(serviceRequestLayerInfo.WhereQuery, [currentFloor, currentBuilding]);
            serviceRequestLayer.show();
            serviceRequestLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            map.setMapCursor('crosshair');
        }
        else {
            serviceRequestLayer.hide();
            map.getLayer(tempServiceRequestLayerId).clear();
            map.setMapCursor('default');
        }
    }
}

//enable or disable service request layer
function enableSubmitRequest() {
    if (isSubmitDisabled) {
        isSubmitDisabled = false;
    }
    else {
        isSubmitDisabled = true;
    }
    if (dojo.coords("divAppContainer").h > 0) {
        dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAppContainer').style.height = '0px';
    }
    if (dojo.coords("divLayerContainer").h > 0) {
        dojo.replaceClass("divLayerContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divLayerContainer').style.height = '0px';
        dojo.byId('txtAddress').blur();
    }
    if (dojo.coords("divAddressContent").h > 0) {
        dojo.replaceClass("divAddressContent", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAddressContent').style.height = '0px';
    }
    ToggleServiceRequestLayer();
}

//add Service request legend items
function AddServiceLegendItem(layer) {
    serviceRequestSymbolURL = layer.renderer.infos[0].symbol.url;
}

//reset Service Request form values
function ResetRequestValues() {
    map.setMapCursor('crosshair');
    dijit.byId('cbRequestType').setValue("");
    dojo.byId('txtDescription').value = "";
    dojo.byId('txtName').value = "";
    dojo.byId('txtMail').value = "";
    dojo.byId('txtPhone').value = "";
    dojo.byId('spanServiceErrorMessage').innerHTML = "";
}

//validate request type
function ValidateRequestType() {
    if (!dijit.byId('cbRequestType').item) {
        dijit.byId('cbRequestType').setValue("");
    }
}

//update the new service request form details to the server
function CreateServiceRequest() {
    if (map.getLayer(tempServiceRequestLayerId).graphics.length == 0) {
        ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("selectLocation")[0].childNodes[0].nodeValue);
        return false;
    }
    if (ValidateRequestData()) {
        ShowLoadingMessage();
        var mapPoint = map.getLayer(tempServiceRequestLayerId).graphics[0].geometry;
        mapPoint.spatialReference = map.spatialReference;
        var date = new js.date();

        var serviceRequestAttributes = {};
        serviceRequestAttributes[serviceRequestFields.RequestTypeFieldName] = dijit.byId("cbRequestType").getValue();
        serviceRequestAttributes[serviceRequestFields.CommentsFieldName] = dojo.byId('txtDescription').value.trim();
        serviceRequestAttributes[serviceRequestFields.NameFieldName] = dojo.byId('txtName').value.trim();
        serviceRequestAttributes[serviceRequestFields.PhoneFieldName] = dojo.byId('txtPhone').value;
        serviceRequestAttributes[serviceRequestFields.EmailFieldName] = dojo.byId('txtMail').value.trim();
        serviceRequestAttributes[serviceRequestFields.StatusFieldName] = "Unassigned";
        serviceRequestAttributes[serviceRequestFields.RequestDateFieldName] = date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
        serviceRequestAttributes[serviceRequestFields.BuildingFieldName] = currentBuilding;
        serviceRequestAttributes[serviceRequestFields.FloorFieldName] = currentFloor;

        if (outsideServiceRequest) {
            serviceRequestAttributes[serviceRequestFields.BuildingFieldName] = outsideBuilding;
            serviceRequestAttributes[serviceRequestFields.FloorFieldName] = 1;
            currentFloor = 1;
        }

        var serviceRequestGraphic = new esri.Graphic(mapPoint, null, serviceRequestAttributes, null);
        map.getLayer(serviceRequestLayerInfo.Key).applyEdits([serviceRequestGraphic], null, null, function (addResults) {
            if (addResults[0].success) {
                var objectIdField = map.getLayer(serviceRequestLayerInfo.Key).objectIdField;
                var requestID = {};
                requestID[serviceRequestFields.RequestIdFieldName] = String(addResults[0].objectId);
                requestID[objectIdField] = addResults[0].objectId;
                var requestGraphic = new esri.Graphic(mapPoint, null, requestID, null);
                map.getLayer(serviceRequestLayerInfo.Key).applyEdits(null, [requestGraphic], null, function () {
                    serviceRequestAttributes[serviceRequestFields.RequestIdFieldName] = String(addResults[0].objectId);
                    HideLoadingMessage();
                    map.infoWindow.hide();
                    selectedGraphics = null;
                    ToggleServiceRequestLayer();
                    if (outsideServiceRequest) {
                        InitializeSpinner(arrBuilding[currentBuilding], 1);
                        CreateFloorSwitcher(arrBuilding, currentBuilding, 1);
                        LocateBuildingFloors(arrBuilding[currentBuilding], 1, true);
                    }
                    alert(messages.getElementsByTagName("serviceReqtId")[0].childNodes[0].nodeValue + serviceRequestAttributes[serviceRequestFields.RequestIdFieldName] + messages.getElementsByTagName("serviceReqIdSuccess")[0].childNodes[0].nodeValue);

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

//validate input data for service request form
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

    if (dojo.byId('txtName').value.trim() != 0) {//validate name field
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
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    if (dojo.byId('txtMail').value.trim().length > 0) {//validate email field
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
    if (dojo.byId('txtPhone').value.trim().length > 0) {//validate phone number
        if (!IsPhoneNumber(dojo.byId('txtPhone').value.trim())) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
        if (dojo.byId('txtPhone').value.trim().length != 10) {
            dojo.byId('txtPhone').focus();
            ShowSpanErrorMessage("spanServiceErrorMessage", messages.getElementsByTagName("spanErrorMsgValidPhone")[0].childNodes[0].nodeValue);
            return false;
        }
    }
    return true;
}