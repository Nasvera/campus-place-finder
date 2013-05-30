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
dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Campus Place Finder" template
    //
    // Use this file to perform the following:
    //
    // 1. Specify application title                                          - [ Tag(s) to look for: ApplicationName ]
    // 2. Set path for application icon                                      - [ Tag(s) to look for: ApplicationIcon ]
    // 3. Set splash screen message                                          - [ Tag(s) to look for: SplashScreenMessage ]
    // 4. Set URL for help page                                              - [ Tag(s) to look for: HelpURL ]
    // 5. Set initial map extent                                             - [ Tag(s) to look for: DefaultExtent ]
    // 6. Set URL for geometry service                                       - [ Tag(s) to look for: GeometryService ]
    // 7. Set URL for Query                                                  - [ Tag(s) to look for: QueryTaskURL ]
    // 8.Specify URLs for basemaps                                           - [ Tag(s) to look for: BaseMapLayers ]
    // 9a.Specify URLs for ServiceRequest                                    - [ Tag(s) to look for: ServiceRequest ]
    // 9b.Customize ServiceRequest info-Popup settings                       - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 10a.Feature layer URL for getting feature details                     - [ Tag(s) to look for: Operational layers]
    // 10b.Customize Operational layers info-Popup settings                  - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 11a.Layer details for searching different space types                 - [ Tag(s) to look for: PlaceLayer]
    // 11b.Customize searching different space types info-Popup settings     - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 12a..Layer details for related Employee table                         - [ Tag(s) to look for: PersonLayer]
    // 12b.Customize Employee table info-Popup settings                      - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 13.Default building selected on load of map                           - [ Tag(s) to look for: DefaultBuilding]
    // 14.Default floor selected within the selected building                - [ Tag(s) to look for: DefaultFloor]
    // 15.Default text for person  Search                                    - [ Tag(s) to look for: PersonText]
    // 16.Default text for place  Search                                     - [ Tag(s) to look for: PlaceText]
    // 17.Customize data formatting                                          - [ Tag(s) to look for: ShowNullValueAs,InfoPopupHeight,InfoPopupWidth]
    // 18.Default Search                                                     - [ Tag(s) to look for: DefaultSearch,FloorSwitcher]
    // 19.Customize comment layers info-Popup settings                       - [ Tag(s) to look for: CommentsInfoPopupFieldsCollection]
    // 20. Specify URLs for map sharing                                      - [ Tag(s) to look for: MapSharingOptions (set TinyURLServiceURL, TinyURLResponseAttribute) ]
    // 20a.In case of changing the TinyURL service
    //     Specify URL for the new service                                   - [ Tag(s) to look for: FacebookShareURL, TwitterShareURL, ShareByMailLink ]

    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Application name to be displayed in the application header.
    ApplicationName: "Campus Place Finder",

    // Application icon to be displayed in the application header.
    ApplicationImage: "images/Finder.png",

    // Application start splash screen message.
    SplashScreenMessage: "<b>Welcome to the Campus Place Finder</b><hr/>The Campus Place Finder application helps employees and guests locate people, offices, conference rooms, and spaces as well as obtain information about those people and places. To locate a person or place, simply click on the map or select what you are searching for; person or place, then enter who or what you are looking for in the search box. The person’s office or space  will then be highlighted on the map and relevant information about the person or space will be displayed in the application.",

    // Path for help file.
    HelpURL: "help.htm",

    // Initial map extent. Use comma (,) to separate values and don't delete the last comma
    DefaultExtent: "-9813487,5126513,-9812723,5126950",

    // Geometry service URL
    GeometryService: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/Utilities/Geometry/GeometryServer",

    // URL for querying total buildings and floors
    QueryTaskURL: {
        QueryURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/0",
        BuildingKey: "${BUILDINGKEY}",
        Floor: "${FLOOR}"
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    // Please note: All base maps need to use the same spatial reference. By default, on application start the first basemap will be loaded

    BaseMapLayers: [{
        Key: "worldTopoMap",
        ThumbnailSource: "images/TopoCampus.png",
        Name: "Campus",
        MapURL: [{
            LayerId: "worldTopoMap",
            MapURL: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
        }, {
            LayerId: "campusMap",
            MapURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/Campus/MapServer"
        }]
    }, {
        Key: "worldImageryMap",
        ThumbnailSource: "images/imagery.jpg",
        Name: "Imagery",
        MapURL: [{
            LayerId: "worldImageryMap",
            MapURL: "http://arcgis-tenone2012-1974758903.us-west-1.elb.amazonaws.com/arcgis/rest/services/ImageryHybrid/MapServer"
        }]
    }],

    // ------------------------------------------------------------------------------------------------------------------------
    // ServiceRequest
    // ------------------------------------------------------------------------------------------------------------------------
    //Set configuration fields for Service Request layer
    ServiceRequest: {
        Instructions: "Please enter an address above or click directly on the map to locate the area you’d like to report. Fill out the form below and click Submit to initiate your service request. A service request number will be issued immediately, please take note of this number in order to track the status of your request. <br /> <br/> <b>Contacting Us by Phone</b> <br/> <hr/> <br/> Customer Service <br/> Hours: 8 am - 4 pm<br/> 555-555-1212 <br/>",
        isEnabled: true,
        LayerInfo: {
            Key: "srFloor0",
            ServiceURL: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/ServiceRequestFloors/FeatureServer/0",
            WhereQuery: "FLOOR = '${0}' AND STATUS = 'Unassigned' AND (BUILDING = '${1}' or BUILDING = 'outside')",
            OutFields: "*",
            RequestId: "${REQUESTID}",
            ShareFields: "${REQUESTID}",
            ShareQuery: "OBJECTID = '${0}'",
            Building: "${BUILDING}",
            Floor: "${FLOOR}",
            RequestTypeFieldName: "REQUESTTYPE",
            CommentsLayerURL: "http://services.arcgis.com/b6gLrKHqgkQb393u/arcgis/rest/services/ServiceRequestFloors/FeatureServer/4",
            CommentsOutFields: "*",
            //Set the primary key attribute for the comments
            CommentId: "${REQUESTID}",
            BuildingFloorPlan: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/2",
            BuildingAttribute: "BUILDINGKEY",
            BuildingKey: "${BUILDINGKEY}"
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // INFO-POPUP SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Info-popup is a popup dialog that gets displayed while creating a service request
        // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats
        InfoPopupFieldsCollection: [{
            DisplayText: "Name:",
            FieldName: "${NAME}",
            HideCondition: true
        }, {
            DisplayText: "Phone:",
            FieldName: "${PHONE}",
            HideCondition: true
        }, {
            DisplayText: "Email:",
            Email: true,
            FieldName: "${EMAIL}",
            HideCondition: true
        }, {
            DisplayText: "Place:",
            FieldName: "${BUILDING}-${FLOOR}",
            DataType: "string"
        }, {
            DisplayText: "Type:",
            FieldName: "${REQUESTTYPE}",
            DataType: "string"
        }, {
            DisplayText: "Description:",
            FieldName: "${COMMENTS}",
            DataType: "description",
            id: "comments"
        }, {
            DisplayText: "Date Submitted:",
            FieldName: "${REQUESTDATE}",
            DataType: "date",
            FormatDateAs: "MMM dd, yyyy"
        }]
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Operational layers:: Feature layer URL for getting feature details
    // Configure operational layers:
    OperationalLayers: [{
        Name: "Building Interior Spaces Type",
        Key: "BuildingInteriorSpacesType",
        MapURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/1",
        Building: "${BUILDING}",
        Floor: "${FLOOR}",
        ObjectID: "${OBJECTID}",
        isLayerVisible: true,
        WhereQuery: "BUILDING = '${0}' AND FLOOR = '${1}'",
        //Please note that value for LOCATION is fetched from "PersonLayer"
        RelationshipQuery: "SPACEID = '${LOCATION}'",
        ShareQuery: "SPACEID='${0}'",
        ShareFields: "${SPACEID}",
        SpaceType: "SPACETYPE",
        SpaceID: "SPACEID",
        BuildingAttribute: "BUILDING",
        hasDynamicMapService: true
    }, {
        Name: "Building Floorplan Lines",
        Key: "BuildingFloorplanLines",
        MapURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/0",
        isLayerVisible: true,
        WhereQuery: "BUILDINGKEY = '${0}' AND FLOOR = '${1}'"
    }],

    // ------------------------------------------------------------------------------------------------------------------------
    // Set layer details for searching different space types
    // ------------------------------------------------------------------------------------------------------------------------
    PlaceLayer: {
        Key: "PlaceLayer",
        QueryURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/1",
        OutFields: "*",
        QueryFields: "BUILDING,FLOOR,SPACEID",
        SpaceType: "${SPACETYPE}",
        SpaceID: "SPACEID",
        DateFields: [{
            DisplayField: "Last Update Date",
            ValueField: "LASTUPDATE",
            AliasField: "Last Update Date"
        }],
        // ------------------------------------------------------------------------------------------------------------------------
        // INFO-POPUP SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Info-popup is a popup dialog that gets displayed on selecting a feature from search results
        // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats
        // The fields FIRSTNAME,LASTNAME,EMAIL,EXTENSION,WING are fetched from "PersonLayer"
        InfoPopupFieldsCollection: [{
            DisplayText: "Name:",
            FieldName: "${FIRSTNAME} ${LASTNAME}",
            HideCondition: true
        }, {
            DisplayText: "Email:",
            FieldName: "${EMAIL}",
            isLink: true,
            HideCondition: true
        }, {
            DisplayText: "Phone:",
            FieldName: "${EXTENSION}",
            HideCondition: true
        }, {
            DisplayText: "Building:",
            FieldName: "${BUILDING}"
        }, {
            DisplayText: "Floor:",
            FieldName: "${FLOOR}"
        }, {
            DisplayText: "Wing:",
            FieldName: "${WING}"
        }],

        Title: "${SPACETYPE}: ${SPACEID}"
    },

    // ------------------------------------------------------------------------------------------------------------------------
    //Set layer details for searching a person
    // ------------------------------------------------------------------------------------------------------------------------
    PersonLayer: {
        Key: "PersonLayer",
        QueryURL: "http://ec2-54-214-140-9.us-west-2.compute.amazonaws.com:6080/arcgis/rest/services/BuildingInterior/MapServer/4",
        OutFields: "OBJECTID,FIRSTNAME,LASTNAME,EMAIL,EXTENSION,BUILDING,FLOOR,WING",
        QueryFields: "FIRSTNAME,LASTNAME",
        //Please note that value for SPACEID is fetched from "PlaceLayer"
        WhereQuery: "LOCATION = '${SPACEID}'",
        FirstName: "FIRSTNAME",
        LastName: "LASTNAME",
        DateFields: [{
            DisplayField: "Last Update Date",
            ValueField: "LASTUPDATE",
            AliasField: "Last Update Date"
        }],
        // ------------------------------------------------------------------------------------------------------------------------
        // INFO-POPUP SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------

        // Info-popup is a popup dialog that gets displayed on selecting a person from search results
        // Set the content to be displayed on the info-Popup. Define labels, field values, field types and field formats

        InfoPopupFieldsCollection: [{
            DisplayText: "Name:",
            FieldName: "${FIRSTNAME} ${LASTNAME}",
            HideCondition: true
        }, {
            DisplayText: "Email:",
            FieldName: "${EMAIL}",
            isLink: true,
            HideCondition: true
        }, {
            DisplayText: "Phone:",
            FieldName: "${EXTENSION}",
            HideCondition: true
        }, {
            DisplayText: "Building:",
            FieldName: "${BUILDING}"
        }, {
            DisplayText: "Floor:",
            FieldName: "${FLOOR}"
        }, {
            DisplayText: "Wing:",
            FieldName: "${WING}"
        }],

        Title: "${SPACETYPE}: ${SPACEID}"

    },
    //Set default building selected when map is loaded
    DefaultBuilding: 'M',

    //Set default floor selected within the selected building
    DefaultFloor: '1',

    //Set default watermark text displayed in search box for person search
    PersonText: "Enter first name or last name or both",

    //Set default watermark text displayed in search box for place search
    PlaceText: "Enter name of place e.g. MA",

    //Set string value to be displayed for null or blank values
    ShowNullValueAs: "N/A",

    // Set size of the info-Popup - select maximum height and width in pixels
    //minimum height should be 200 for the info-popup in pixels
    InfoPopupHeight: 275,

    // Minimum width should be 330 for the info-popup in pixels
    InfoPopupWidth: 330,

    //Set default search
    //Please note: Both values should not be same
    DefaultSearch: {
        Person: true,
        Place: false
    },

    //Set floor switcher
    FloorSwitcher: {
        IsExpressVisible: true,
        IsAccordionVisible: false
    },

    // Define the database field names
    // Note: DateFieldName refers to a date database field.
    // All other attributes refer to text database fields.
    DatabaseFields: {
        RequestIdFieldName: "REQUESTID",
        CommentsFieldName: "COMMENTS",
        DateFieldName: "SUBMITDT",
        RankFieldName: "RANK"
    },

    //Define service request input fields for submitting a new request
    ServiceRequestFields: {
        RequestTypeFieldName: "REQUESTTYPE",
        CommentsFieldName: "COMMENTS",
        NameFieldName: "NAME",
        PhoneFieldName: "PHONE",
        EmailFieldName: "EMAIL",
        StatusFieldName: "STATUS",
        RequestDateFieldName: "REQUESTDATE",
        BuildingFieldName: "BUILDING",
        FloorFieldName: "FLOOR",
        RequestIdFieldName: "REQUESTID"
    },

    //Define building and floor input fields for getting the exact location on map click
    BuildingFloorFields: {
        BuildingFieldName: "BUILDING",
        FloorFieldName: "FLOOR",
        SpaceTypeFieldName: "SPACETYPE",
        SpaceIdFieldName: "SPACEID",
        SectionFieldName: "SECTION"
    },

    //Set info-pop fields for adding and displaying comment for existing service request
    CommentsInfoPopupFieldsCollection: {
        Rank: "${RANK}",
        SubmitDate: "${SUBMITDT}",
        Comments: "${COMMENTS}"
    },

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for TinyURL service, and URLs for social media
    MapSharingOptions: {
        TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
        TinyURLResponseAttribute: "data.url",
        FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=Campus%20Building%20Viewer",
        TwitterShareURL: "http://twitter.com/home/?status=Campus%20Building%20Viewer ${0}",
        ShareByMailLink: "mailto:%20?subject=Checkout%20this%20map!&body=${0}"
    }
});
