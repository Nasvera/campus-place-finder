/*global */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
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

//clear Graphics layer
function ClearGraphics() {
    var layer = map.getLayer(queryGraphicLayer);
    if (layer) {
        layer.clear();
    }
}

//create picture marker
function CreateImage(imageSrc, title, isCursorPointer, imageWidth, imageHeight) {
    var imgLocate = document.createElement("img");
    imgLocate.style.width = imageWidth + 'px';
    imgLocate.style.height = imageHeight + 'px';
    if (isCursorPointer) {
        imgLocate.style.cursor = 'pointer';
    }
    imgLocate.src = imageSrc;
    imgLocate.title = title;
    return imgLocate;
}

//create text area for comments
function CreateTextArea(id, width, height, className) {
    var txtArea = document.createElement("textarea");
    txtArea.id = id;
    txtArea.style.height = height;
    txtArea.style.width = width;
    txtArea.className = className;
    return txtArea;
}

//create rating control
function CreateRatingControl(readonly, ctlId, intitalValue, numStars) {
    var ratingCtl = document.createElement("ul");
    ratingCtl.setAttribute("readonly", readonly);
    ratingCtl.id = ctlId;
    ratingCtl.setAttribute("value", intitalValue);
    ratingCtl.setAttribute("numStars", numStars);
    ratingCtl.style.padding = 0;
    ratingCtl.style.margin = 0;
    return ratingCtl;
}

//create Rating widget for comments
function CreateRatingWidget(rating) {
    var numberStars = Number(rating.getAttribute("numstars"));
    var isReadOnly = String(rating.getAttribute("readonly")).bool();

    for (var i = 0; i < numberStars; i++) {
        var li = document.createElement("li");
        rating.appendChild(li);
        li.value = (i + 1);
        li.className = "ratingStar";
        if (i < rating.value) {
            dojo.addClass(li, "ratingStarChecked");
        }

        li.onmouseover = function () {
            if (!isReadOnly) {
                var ratingValue = Number(this.value);
                var ratingStars = dojo.query(".ratingStar", rating);
                for (var i = 0; i < ratingValue; i++) {
                    dojo.addClass(ratingStars[i], "ratingStarChecked");
                }
            }
        }

        li.onmouseout = function () {
            if (!isReadOnly) {
                var ratings = Number(rating.value);
                var ratingStars = dojo.query(".ratingStar", rating);
                for (var i = 0; i < ratingStars.length; i++) {
                    if (i < ratings) {
                        dojo.addClass(ratingStars[i], "ratingStarChecked");
                    }
                    else {
                        dojo.removeClass(ratingStars[i], "ratingStarChecked");
                    }
                }
            }
        }

        li.onclick = function () {
            if (!isReadOnly) {
                rating.value = Number(this.value);
                var ratingStars = dojo.query(".ratingStar", rating);

                for (var i = 0; i < ratingStars.length; i++) {
                    if (i < this.value) {
                        dojo.addClass(ratingStars[i], "ratingStarChecked");
                    }
                    else {
                        dojo.removeClass(ratingStars[i], "ratingStarChecked");
                    }
                }
            }
        }
    }
}

//display rating for comments
function SetRating(control, rating) {
    control.value = rating;
    var ratingStars = dojo.query(".ratingStar", control);
    for (var i = 0; i < ratingStars.length; i++) {
        if (i < rating) {
            dojo.addClass(ratingStars[i], "ratingStarChecked");
        }
        else {
            dojo.removeClass(ratingStars[i], "ratingStarChecked");
        }
    }
}

//convert string to Boolean
String.prototype.bool = function () {
    return (/^true$/i).test(this);
};

//display loading image in comments tab
function ShowDojoLoading(target) {
    dijit.byId('dojoStandBy').target = target;
    dijit.byId('dojoStandBy').show();
}

//hide loading image
function HideDojoLoading() {
    dijit.byId('dojoStandBy').hide();
}

function HideInfoWindow() {
    SelectedId = null;
    map.getLayer(tempServiceRequestLayerId).clear();
}

//display container with wipe-in animation
function WipeInControl(node, duration) {
    var animation = dojo.fx.wipeIn({
        node: node,
        duration: duration
    }).play();
}

//hide container with wipe-out animation
function WipeOutControl(node, duration) {
    dojo.fx.wipeOut({
        node: node,
        duration: duration
    }).play();
}

//remove container div
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}

//display Standby screen
function ShowLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = "block";
}

//show error message in info-window
function ShowSpanErrorMessage(controlId, message) {
    dojo.byId(controlId).style.display = "block";
    dojo.byId(controlId).innerHTML = message;
}

//hide Standby screen
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//show error message with color
function ShowErrorMessage(control, message, color) {
    var ctl = dojo.byId(control);
    ctl.style.display = 'block';
    ctl.innerHTML = message;
    ctl.style.color = color;
}

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
}

//append "..." at the end for a long string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Create dynamic scrollbar within container for display content
function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;

    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    }
    else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }

    var containerHeight = dojo.coords(container);
    scrollbar_track.style.height = containerHeight.h + "px";
    scrollbar_track.style.top = '0px';
    scrollbar_track.style.right = containerHeight.l + 'px';

    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";

    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);

    if (content.scrollHeight <= content.offsetHeight) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    }
    else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;

        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }

        content.onmousewheel = function (evt) {
            ScrollDiv(evt);
        }
    }

    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;

        if (delta <= -120) {
            var y = pxTop + 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
        else {
            var y = pxTop - 10;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }

    //Attach events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop //set vertical position of slider at start
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            }
            else
                offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax // Limit vertical movement
                if (y < 0) y = 0 // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            }
            else {
                return;
            }
        }
        isHandleClicked = false;
    };

    //Attach events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop //set vertical position of slider at start
        yCoord = evt.screenY  //set vertical position of mouse at start
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax // Limit vertical movement
            if (y < 0) y = 0 // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };

    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };

    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };
}

//remove scroll bar
function RemoveScrollBar(container) {
    if (dojo.byId(container.id + 'scrollbar_track')) {
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
}

//validate name
function IsName(name) {
    var namePattern = /^[A-Za-z\.\-\-', ]{3,100}$/;

    if (namePattern.test(name)) {
        return true;
    } else {
        return false;
    }
}

//validate phone number
function IsPhoneNumber(value) {
    var namePattern = /\d{10}/;
    if (namePattern.test(value)) {
        return true;
    } else {
        return false;
    }
}

//validate Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^([a-zA-Z])([a-zA-Z0-9])*((\.){0,1}(\_){0,1}(\-){0,1}([a-zA-Z0-9])+)*@(([a-zA-Z0-9])+(\.))+([a-zA-Z]{2,4})+$/;
    if (pattern.test(emailValue)) {
        return true;
    }
    else {
        return false;
    }
}

//validate Email for comments in comments tab
function CheckCommentMailFormat(emailValue) {
    var pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i
    if (pattern.test(emailValue)) {
        return true;
    }
    else {
        return false;
    }
}

//show locator container and close other containers in header
function ShowLocateContainer() {
    // Hide other commands
    RemoveChildren(dojo.byId('tblAddressResults'));
    dojo.byId('txtAddress').blur();
    if (dojo.coords("divAppContainer").h > 0) {
        dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAppContainer').style.height = '0px';
    }
    if (dojo.coords("divLayerContainer").h > 0) {
        dojo.replaceClass("divLayerContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divLayerContainer').style.height = '0px';
        dojo.byId('txtAddress').blur();
    }
    // Switch to hidden class if visible now
    dojo.replaceClass("divExpress", "hideContainerHeight", "showContainerHeight");
    dojo.replaceClass("divAccordion", "hideContainerHeight", "showContainerHeight");

    // Toggle address
    if (dojo.coords("divAddressContent").h > 0) {
        dojo.replaceClass("divAddressContent", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAddressContent').style.height = '0px';
        dojo.byId('txtAddress').blur();
    }
    else {
        dojo.byId("txtAddress").style.color = "gray";
        if (dojo.byId("tdSearchPerson").className == "tdSearchByPerson") {
            dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("displayPerson");
            lastSearchString = dojo.byId("txtAddress").value.trim();
        }
        else {
            dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("displayPlace");
            lastSearchString = dojo.byId("txtAddress").value.trim();
        }
        dojo.byId("divAddressContent").style.height = "310px";
        dojo.replaceClass("divAddressContent", "showContainerHeight", "hideContainerHeight");

        setTimeout(function () {
            dojo.byId('txtAddress').style.verticalAlign = "middle";

        }, 500);
    }
    SetHeightAddressResults();
}

//show accordion and hide other containers in header panel
function ShowAccordion() {
    // Hide other commands
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

    // Toggle express
    if(dojo.hasClass("divExpress", "showContainerHeight")) {
        // Visible now, so switch to hidden class
        dojo.replaceClass("divExpress", "hideContainerHeight", "showContainerHeight");
    } else if(dojo.hasClass("divExpress", "hideContainerHeight")) {
        // Hidden now, so switch to visible class
        dojo.replaceClass("divExpress", "showContainerHeight", "hideContainerHeight");
    }

    // Toggle accordion
    if(dojo.hasClass("divAccordion", "showContainerHeight")) {
        // Visible now, so switch to hidden class
        dojo.replaceClass("divAccordion", "hideContainerHeight", "showContainerHeight");
    } else if(dojo.hasClass("divAccordion", "hideContainerHeight")) {
        // Hidden now, so switch to visible class
        dojo.replaceClass("divAccordion", "showContainerHeight", "hideContainerHeight");
    }
}

//create scrollbar for address results
function SetHeightAddressResults() {
    var height = dojo.coords('divAddressContent').h;
    if (height > 0) {
        dojo.byId('divAddressScrollContent').style.height = (height - 150) + "px";
    }
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
}

//Create the tiny url with current extent and selected feature
function ShareLink(ext) {
    tinyUrl = null;
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(windowURL);
    if (SelectedId) {
        var urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$SelectedId=" + SelectedId;
    }
    else if (buildingID && floorID) {
        var urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$buildingID=" + buildingID + "$floorID=" + floorID;
    }
    else {
        var urlStr = encodeURI(url.path) + "?extent=" + mapExtent;
    }
    url = dojo.string.substitute(mapSharingOptions.TinyURLServiceURL, [urlStr]);

    ShowLoadingMessage();
    dojo.io.script.get({
        url: url,
        callbackParamName: "callback",
        load: function (data) {
            HideLoadingMessage();
            tinyResponse = data;
            tinyUrl = data;
            var attr = mapSharingOptions.TinyURLResponseAttribute.split(".");
            for (var x = 0; x < attr.length; x++) {
                tinyUrl = tinyUrl[attr[x]];
            }
            if (ext) {
                // Hide other commands
                if (dojo.coords("divLayerContainer").h > 0) {
                    dojo.replaceClass("divLayerContainer", "hideContainerHeight", "showContainerHeight");
                    dojo.byId('divLayerContainer').style.height = '0px';
                }
                if (dojo.coords("divAddressContent").h > 0) {
                    dojo.replaceClass("divAddressContent", "hideContainerHeight", "showContainerHeight");
                    dojo.byId('divAddressContent').style.height = '0px';
                }
                // Switch to hidden class if visible now
                dojo.replaceClass("divExpress", "hideContainerHeight", "showContainerHeight");
                dojo.replaceClass("divAccordion", "hideContainerHeight", "showContainerHeight");

                // Toggle share
                var cellHeight = 60;
                if (dojo.coords("divAppContainer").h > 0) {
                    dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
                    dojo.byId('divAppContainer').style.height = '0px';
                }
                else {
                    dojo.byId('divAppContainer').style.height = cellHeight + "px";
                    dojo.replaceClass("divAppContainer", "showContainerHeight", "hideContainerHeight");
                }
            }
        },
        error: function (error) {
            HideLoadingMessage();
            alert(tinyResponse.error);
            SelectedId = null;
        }
    });
    setTimeout(function () {
        HideLoadingMessage();
        if (!tinyResponse) {
            SelectedId = null;
            alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
            return;
        }
    }, 6000);
}

//Open login page for facebook,tweet and open Email client with shared link for Email
function Share(site) {
    if (dojo.coords("divAppContainer").h > 0) {
        dojo.replaceClass("divAppContainer", "hideContainerHeight", "showContainerHeight");
        dojo.byId('divAppContainer').style.height = '0px';
    }
    if (tinyUrl) {
        switch (site) {
            case "facebook":
                window.open(dojo.string.substitute(mapSharingOptions.FacebookShareURL, [tinyUrl]));
                break;
            case "twitter":
                window.open(dojo.string.substitute(mapSharingOptions.TwitterShareURL, [tinyUrl]));
                break;
            case "mail":
                parent.location = dojo.string.substitute(mapSharingOptions.ShareByMailLink, [tinyUrl]);
                break;
        }
    }
    else {
        alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
        return;
    }
}

//Get current map Extent
function GetMapExtent() {
    var extents = Math.round(map.extent.xmin).toString() + "," + Math.round(map.extent.ymin).toString() + "," +
                  Math.round(map.extent.xmax).toString() + "," + Math.round(map.extent.ymax).toString();
    return (extents);
}

//style and enable the person search icon
function ShowPersonSearch() {
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("displayPerson");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId('divAddressScrollContainer'));
    dojo.byId("tdSearchPerson").className = "tdSearchByPerson";
    dojo.byId("tdSearchPlace").className = "tdSearchByUnPlace";
    dojo.byId("tdAddressSearch").style.display = "block";
}

//style and enable the place search icon
function ShowPlaceSearch() {
    dojo.byId("txtAddress").style.color = "gray";
    dojo.byId("txtAddress").value = dojo.byId("txtAddress").getAttribute("displayPlace");
    lastSearchString = dojo.byId("txtAddress").value.trim();
    RemoveChildren(dojo.byId('tblAddressResults'));
    RemoveScrollBar(dojo.byId('divAddressScrollContainer'));
    dojo.byId("tdSearchPerson").className = "tdSearchByUnPerson";
    dojo.byId("tdSearchPlace").className = "tdSearchByPlace";
    dojo.byId("tdAddressSearch").style.display = "block";
}

//clear default value
function ClearDefaultText(e) {
    if (dojo.byId("tdSearchPerson").className == "tdSearchByPerson") {
        dojo.byId("txtAddress").value = '';
        dojo.byId("txtAddress").style.color = "white";
    }
    if (dojo.byId("tdSearchPlace").className == "tdSearchByPlace") {
        dojo.byId("txtAddress").value = '';
        dojo.byId("txtAddress").style.color = "white";
    }
}

//Set default value on blur
function ReplaceDefaultText(e) {
    var target = window.event ? window.event.srcElement : e ? e.target : null;
    if (!target) return;

    if (dojo.byId("tdSearchPlace").className == "tdSearchByPlace") {
        ResetTargetValue(target, "displayPlace", "gray");
    }
    else {
        ResetTargetValue(target, "displayPerson", "gray");
    }
}

//Set changed value for person/place
function ResetTargetValue(target, title, color) {
    if (target.value == '' && target.getAttribute(title)) {
        target.value = target.title;
        if (target.title == "") {
            target.value = target.getAttribute(title);
        }
    }
    target.style.color = color;
    lastSearchString = dojo.byId("txtAddress").value.trim();
}
//Get query string value of the provided key, if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}

//Hide splash screen container
function HideSplashScreenMessage() {
    if (dojo.isIE < 9) {
        dojo.byId("divSplashScreenContent").style.display = "none";
    }
    dojo.addClass('divSplashScreenContainer', "opacityHideAnimation");
    dojo.replaceClass("divSplashScreenContent", "hideContainer", "showContainer");
}

//set height for splash screen
function SetSplashScreenHeight() {
    var height = dojo.coords('divSplashScreenContent').h - 80;
    dojo.byId('divSplashContent').style.height = (height + 14) + "px";
    CreateScrollbar(dojo.byId("divSplashContainer"), dojo.byId("divSplashContent"));
}

// hide create request container
function HideCreateRequestContainer() {
    selectedGraphics = null;
    map.infoWindow.hide();
    map.getLayer(tempGraphicLayer).clear();
    dojo.byId('divCreateRequestContainer').style.display = "none";

    if (dojo.byId("divSubmitRequestContainer")) {
        dojo.destroy(dojo.byId("divSubmitRequestContainer"));
    }
    dojo.destroy(dojo.byId("divInfoContainer"));
}

function HideDetailsInfo() {
    selectedGraphics = null;
    SelectedId = null;
    map.infoWindow.hide();
    dojo.byId('divDetailsInfo').style.display = "none";
    dojo.destroy(dojo.byId("divInfoContainer"));
}

//Restrict the maximum no of characters in the text area control
function ImposeMaxLength(Object, MaxLen) {
    return (Object.value.length <= MaxLen);
}

//clear the comments container
function HideCommentsContainer() {
    selectedGraphics = null;
    map.infoWindow.hide();
    dojo.byId('divCommentsInfo').style.display = "none";
    dojo.destroy(dojo.byId("divDetailsContainer"));
    dojo.destroy(dojo.byId("divComments"));
}
