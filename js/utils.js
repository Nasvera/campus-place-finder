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
//Function for displaying Help window
function ShowHelp() {
    window.open(helpFileURL, "helpwindow");
    var helpbutton = dijit.byId('imgHelp');
    helpbutton.attr("checked", false);
}

//function for adding graphic to a layer.
function AddGraphic(layer, symbol, point, attr) {
    var graphic = new esri.Graphic(point, symbol, attr, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    layer.add(featureSet.features[0]);
}

//Function For Clearing All Graphics
function ClearAll() {
    map.infoWindow.hide();
    //map.graphics.clear();
    for (var i = 0; i < map.graphicsLayerIds.length; i++) {
        map.getLayer(map.graphicsLayerIds[i]).clear();
    }
}

function ClearGraphics() {
    var layer = map.getLayer(queryGraphicLayer);
    if (layer) {
        layer.clear();
    }
}

//Function triggered for creating image
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

//function to create textarea
function CreateTextArea(id, width, height, className) {
    var txtArea = document.createElement("textarea");
    txtArea.id = id;
    txtArea.style.height = height;
    txtArea.style.width = width;
    txtArea.className = className;
    return txtArea;
}

//function to create rating control
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

//function to create Rating widget
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

//Set rating for rating control
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

//function to convert string to bool
String.prototype.bool = function () {
    return (/^true$/i).test(this);
};

//function to find custom anchor point
function GetInfoWindowAnchor(pt, infoWindowWidth) {
    var verticalAlign;
    if (pt.y < map.height / 2) {
        verticalAlign = "LOWER";
    }
    else {
        verticalAlign = "UPPER";
    }
    if ((pt.x + infoWindowWidth) > map.width) {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "LEFT"];
    }
    else {
        return esri.dijit.InfoWindow["ANCHOR_" + verticalAlign + "RIGHT"];
    }
}

//Function for displaying loading image in comments tab
function ShowDojoLoading(target) {
    dijit.byId('dojoStandBy').target = target;
    dijit.byId('dojoStandBy').show();
}

//Function for hiding loading image
function HideDojoLoading() {
    dijit.byId('dojoStandBy').hide();
}

function HideInfoWindow() {
    map.getLayer(tempServiceRequestLayerId).clear();
}

//Function triggered for animating address container
function AnimateAdvanceSearch(rowCount) {
    var node = dojo.byId('divAddressContainer');
    if (node.style.display == "none") {
        WipeInControl(node, 0, 500);
    }
}

//Dojo function to animate(wipe in) address container
function WipeInControl(node, height, duration) {
    var animation = dojo.fx.wipeIn({
        node: node,
        height: height,
        duration: duration
    }).play();
}

//Dojo function to animate(wipe out) address container
function WipeOutControl(node, duration) {
    dojo.fx.wipeOut({
        node: node,
        duration: duration
    }).play();
}

//Function for refreshing address container div
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}

//Function for displaying Standby text
function ShowLoadingMessage(loadingMessage) {
    dojo.byId('divLoadingIndicator').style.display = 'block';
    dojo.byId('loadingMessage').innerHTML = loadingMessage;
}

//function to show error message span
function ShowSpanErrorMessage(controlId, message) {
    dojo.byId(controlId).style.display = "block";
    dojo.byId(controlId).innerHTML = message;
}

//Function for hiding Standby text
function HideLoadingMessage() {
    dojo.byId('divLoadingIndicator').style.display = 'none';
}

//Function for positioning searchlist exactly below search textbox dynamically.
function PositionAddressList() {
    var coords = dojo.coords('txtAddress');
    //locating searchlist dynamically.
    dojo.style(dojo.byId('divAddressContainer'), {
        left: (coords.x - 2) + "px"
    });
}

//function to set text to span control
function ShowErrorMessage(control, message, color) {
    var ctl = dojo.byId(control);
    ctl.style.display = 'block';
    ctl.innerHTML = message;
    ctl.style.color = color;
}

//function to blink text
function BlinkNode(control) {
    var fadeout = dojo.fadeOut({ node: control, duration: 100 });
    var fadein = dojo.fadeIn({ node: control, duration: 250 });
    dojo.fx.chain([fadeout, fadein, fadeout, fadein]).play();
}

//Check for valid numeric strings
function IsNumeric(dist) {
    if (!/\D/.test(dist))
        return true;
    else if (/^\d+\.\d+$/.test(dist))
        return true;
    else
        return false;
}

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
}

//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}

//Creating dynamic scrollbar within container for target content
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
            console.log(content.id);
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

    //Attaching events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
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

    //Attaching events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            console.log("inside mousemove");
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

//Function for displaying Alert messages
function ShowDialog(title, message) {
    dojo.byId('divMessage').innerHTML = message;
    var dialog = dijit.byId('dialogAlertMessage');
    dialog.titleNode.innerHTML = title;
    dialog.show();
    dojo.byId('divOKButton').focus();
}

//Function for hiding Alert messages
function CloseDialog() {
    dijit.byId('dialogAlertMessage').hide();
}

//function to hide BaseMapWidget onmouseout
function HideBaseMapWidget() {
    dijit.byId('imgBaseMap').attr("checked", false);
    var node = dojo.byId('divBaseMapTitleContainer');
    if (dojo.coords(node).h > 0) {
        WipeOutControl(node, 500);
    }
}

var customMouseHandler =
{
    evtHash: [],

    ieGetUniqueID: function (_elem) {
        if (_elem === window) { return 'theWindow'; }
        else if (_elem === document) { return 'theDocument'; }
        else { return _elem.uniqueID; }
    },

    addEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.addEventListener != 'undefined') {
            if (_evtName == 'mouseenter')
            { _elem.addEventListener('mouseover', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else if (_evtName == 'mouseleave')
            { _elem.addEventListener('mouseout', customMouseHandler.mouseEnter(_fn), _useCapture); }
            else
            { _elem.addEventListener(_evtName, _fn, _useCapture); }
        }
        else if (typeof _elem.attachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt_' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined')
            { return; }

            f = function () {
                _fn.call(_elem);
            };

            customMouseHandler.evtHash[key] = f;
            _elem.attachEvent('on' + _evtName, f);

            // attach unload event to the window to clean up possibly IE memory leaks
            window.attachEvent('onunload', function () {
                _elem.detachEvent('on' + _evtName, f);
            });

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
        else
        { _elem['on' + _evtName] = _fn; }
    },

    removeEvent: function (_elem, _evtName, _fn, _useCapture) {
        if (typeof _elem.removeEventListener != 'undefined')
        { _elem.removeEventListener(_evtName, _fn, _useCapture); }
        else if (typeof _elem.detachEvent != 'undefined') {
            var key = '{FNKEY::obj_' + customMouseHandler.ieGetUniqueID(_elem) + '::evt' + _evtName + '::fn_' + _fn + '}';
            var f = customMouseHandler.evtHash[key];
            if (typeof f != 'undefined') {
                _elem.detachEvent('on' + _evtName, f);
                delete customMouseHandler.evtHash[key];
            }

            key = null;
            //f = null;   /* DON'T null this out, or we won't be able to detach it */
        }
    },

    mouseEnter: function (_pFn) {
        return function (_evt) {
            var relTarget = _evt.relatedTarget;
            if (this == relTarget || customMouseHandler.isAChildOf(this, relTarget))
            { return; }

            _pFn.call(this, _evt);
        }
    },

    isAChildOf: function (_parent, _child) {
        if (_parent == _child) { return false };

        while (_child && _child != _parent)
        { _child = _child.parentNode; }

        return _child == _parent;
    }
};

//function to validate name
function IsName(name) {
    //    var namePattern = /^[A-Za-z\.\-\' ]{1,150}$/;
    var namePattern = /^[A-Za-z\.\-\-', ]{3,100}$/;

    if (namePattern.test(name)) {
        return true;
    } else {
        return false;
    }
}

//function to validate 10 digit number
function IsPhoneNumber(value) {
    var namePattern = /\d{10}/;
    if (namePattern.test(value)) {
        return true;
    } else {
        return false;
    }
}

//Function for validating Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^(?:\w+\.?)*\w+@(?:\w+\.)+\w+$/;
    if (pattern.test(emailValue)) {
        return true;
    } else {
        return false;
    }
}