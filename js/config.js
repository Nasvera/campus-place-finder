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
dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Campus Building Viewer" template
    //
    // Use this file to perform the following:
    //
    // 1. Specify application title                                          - [ Tag(s) to look for: ApplicationName ]
    // 2. Set path for application icon                                      - [ Tag(s) to look for: ApplicationIcon ]
    // 3. Set splash screen message                                          - [ Tag(s) to look for: SplashScreenMessage ]
    // 4. Set URL for help page                                              - [ Tag(s) to look for: HelpURL ]
    // 5. Set initial map extent                                             - [ Tag(s) to look for: DefaultExtent ]
    // 6. Set URL for geometry service                                       - [ Tag(s) to look for: GeometryService ]
    // 7. Set URL for Query                                                  - [ Tag(s) to look for: QueryURL ]
    // 8a.Specify URLs for basemaps                                          - [ Tag(s) to look for: BaseMapLayers ]
    // 8b.Specify URLs for ServiceRequest                                    - [ Tag(s) to look for: ServiceRequest ]
    // 8c.Customize ServiceRequest info-Popup settings                       - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 9a.Feature layer url for getting feature details                      - [ Tag(s) to look for: Operational layers]
    // 9b.Customize Operational layers info-Popup settings                   - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 10a.Layer details for searching different space types.                - [ Tag(s) to look for: PlaceLayer]
    // 10b.Customize searching different space types info-Popup settings     - [ Tag(s) to look for: InfoPopupFieldsCollection]
    // 11.Default building selected on load of map.                          - [ Tag(s) to look for: DefaultBuilding]
    // 12.Default floor selected within the selected building.               - [ Tag(s) to look for: DefaultFloor]
    // 13.Default text for Person Search                                     - [ Tag(s) to look for: PersonText]
    // 14.Default text for Place  Search                                     - [ Tag(s) to look for: PlaceText]
    // 15.Customize data formatting                                          - [ Tag(s) to look for: ShowNullValueAs]
    // 16.Default Search                                                     - [ Tag(s) to look for: DefaultSearch,FloorSwitcher]
    // 17a.Layer details for related Employee table.                         - [ Tag(s) to look for: PersonLayer]
    // 17b.Customize Employee table info-Popup settings                      - [ Tag(s) to look for: InfoPopupFieldsCollection]




    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    //Application name to be displayed in the application header.
    ApplicationName: "Campus Place Finder",

    //Application icon to be displayed in the application header.
    ApplicationImage: "images/Finder.PNG",

    //Application start splash screen message.
    SplashScreenMessage: "<b>Welcome to the Campus Place Finder</b><hr/>The Campus Place Finder application helps employees and guests locate people, offices, conference rooms, and spaces as well as obtain information about those people and places. To locate a person or place, simply click on the map or select what you are searching for; person or place, then enter who or what you are looking for in the search box. The person’s office or space  will then be highlighted on the map and relevant information about the person or space will be displayed in the application.",

    //Path for help file.
    HelpURL: "help.htm",

    //Default initial map extent.
    DefaultExtent: "-13046368.774366917,4036413.338302078,-13046063.02625387,4036524.7094409126",

    //Geometry service url
    GeometryService: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Geometry/GeometryServer",

    //Url for querying total buildings and floors.
    QueryURL: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/0",

    // ------------------------------------------------------------------------------------------------------------------------
    // BASEMAP SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    // Set baseMap layers
    //Basemap layers:Basemap layer collection. (All the basemap’s need to be in the same spatial reference)

    BaseMapLayers:
            [
		{
		    Key: "worldTopoMap",
		    ThumbnailSource: "images/TopoCampus.png",
		    Name: "Topo + Campus",
		    MapURL: [
				        {
				            LayerId: "worldTopoMap",
				            MapURL: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
				        },
				        {
				            LayerId: "campusMap",
				            MapURL: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/Campus/MapServer"
				        }
			        ]
		},
		{
		    Key: "worldImageryMap",
		    ThumbnailSource: "images/imagery.jpg",
		    Name: "Imagery",
		    MapURL: [
				        {
				            LayerId: "worldImageryMap",
				            MapURL: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
				        }
			        ]
		}
	       ],

	   // ------------------------------------------------------------------------------------------------------------------------
	   // ServiceRequest
	   // ------------------------------------------------------------------------------------------------------------------------
       ServiceRequest:
              {
                  Instructions: "Please enter a location above or click directly on the map to locate the area you’d like to report. Fill out the form below and click Submit to initiate your service request. A service request number will be issued immediately, please take note of this number in order to track the status of your request. <br /> <br/> <b>Contacting Us by Phone</b> <br/> <hr/> <br/> Customer Service <br/> Hours: 8 am - 4 pm<br/> 555-555-1212 <br/>",
                  isEnabled: false,
                  LayerInfo:
                      {
                          Key: "srFloor0",
                          ServiceUrl: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/ServiceRequest/FeatureServer/0",
                          WhereQuery: "FLOOR = '${0}' AND STATUS = 'Unassigned' AND (BUILDING = '${1}' or BUILDING = 'outside')",
                          OutFields: "*", RequestTypeFieldName: "REQUESTTYPE",
                          CommentsLayerURL: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/ServiceRequest/FeatureServer/4",
                          CommentsOutFields: "*",
                          BuildingFloorPlan: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/2",
                          BuildingAttribute: "BUILDINGKEY"
                      },
                  // ------------------------------------------------------------------------------------------------------------------------
                  // INFO-WINDOW SETTINGS
                  // ------------------------------------------------------------------------------------------------------------------------
                  InfoPopupFieldsCollection:
                      [
                          {
			                  DisplayText: "Place:",
			                  FieldName: "${BUILDING}-${FLOOR}",
			                  DataType: "string"
			              },
			              {
			                  DisplayText: "Problem:",
			                  FieldName: "${REQUESTTYPE}",
			                  DataType: "string"
			              },
			              {
			                  DisplayText: "Description:",
			                  FieldName: "${COMMENTS}",
			                  DataType: "description",
			                  id: "comments"
			              },
			              {
			                  DisplayText: "Date Submitted:",
			                  FieldName: "${REQUESTDATE}",
			                  DataType: "date",
			                  FormatDateAs: "MMM dd, yyyy"
			              }

		              ]
			          },

    // ------------------------------------------------------------------------------------------------------------------------
    // OPERATIONAL DATA SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    //Operational layers:: Feature layer url for getting feature details
    OperationalLayers:
           [
		         {
		              Name: "Building Interior Spaces Type",
		              Key: "BuildingInteriorSpacesType",
		              MapURL: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/1",
		              DateFields:
                        [
				            {
				                DisplayField: "Last Update Date",
				                ValueField: "LASTUPDATE",
				                AliasField: "Last Update Date"
				            }
				        ],

		     // ------------------------------------------------------------------------------------------------------------------------
		     // INFO-WINDOW SETTINGS
		     // ------------------------------------------------------------------------------------------------------------------------
		     InfoPopupFieldsCollection:
                        [
					        {
					            DisplayText: "Name:",
					            FieldName: "${FIRSTNAME} ${LASTNAME}",
					            HideCondition: true
					        },
					        {
					            DisplayText: "Email:",
					            FieldName: "${EMAIL}",
					            "isLink": true,
                                HideCondition: true
					        },
					        {
					            DisplayText: "Phone:",
					            FieldName: "${EXTENSION}",
					            HideCondition: true
					        },
					        {
					            DisplayText: "Building:",
					            FieldName: "${BUILDING}"
					        },
					        {
					            DisplayText: "Floor:",
					            FieldName: "${FLOOR}"
					        },
					        {
					            DisplayText: "Wing:",
					            FieldName: "${WING}"
					        }
				        ],
		     Title: "${SPACETYPE} : ${SPACEID}",
		     InfoWindowSize: "270,160",
		     isLayerVisible: true,
		     WhereQuery: "BUILDING = '${0}' AND FLOOR = '${1}'",
		     BuildingAttribute: "BUILDING",
		     hasDynamicMapService: true
		 },
	   {
	         Name: "Building Floorplan Lines",
	         Key: "BuildingFloorplanLines",
	         MapURL: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/0",
	         isLayerVisible: true,
	         WhereQuery: "BUILDINGKEY = '${0}' AND FLOOR = '${1}'"
        }
	],


     // ------------------------------------------------------------------------------------------------------------------------
     //Layer details for searching different space types.
     // ------------------------------------------------------------------------------------------------------------------------
     PlaceLayer:
      {
          Key: "PlaceLayer",
          QueryUrl: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/1",
          OutFields: "*",
          QueryFields: "BUILDING,FLOOR,SPACEID",
          DateFields:
                [
				    {
                        DisplayField: "Last Update Date",
				        ValueField: "LASTUPDATE",
				        AliasField: "Last Update Date"
				    }
                ],
        // ------------------------------------------------------------------------------------------------------------------------
	    // INFO-WINDOW SETTINGS
	    // ------------------------------------------------------------------------------------------------------------------------
        InfoPopupFieldsCollection:
                [
					{
					    DisplayText: "Name:",
					    FieldName: "${FIRSTNAME} ${LASTNAME}",
					    HideCondition: true
					},
					{
					    DisplayText: "Email:",
					    FieldName: "${EMAIL}",
					    isLink: true,
					    HideCondition: true
					},
					{
					    DisplayText: "Phone:",
					    FieldName: "${EXTENSION}",
					    HideCondition: true
					},
					{
					    DisplayText: "Building:",
					    FieldName: "${BUILDING}"
					},
					{
					    DisplayText: "Floor:",
					    FieldName: "${FLOOR}"
					},
					{
					    DisplayText: "Wing:",
					    FieldName: "${WING}"
					}
				],
          Title: "${SPACETYPE} : ${SPACEID}",
          InfoWindowSize: "270,160"
      },

    //Default building selected on load of map.
    DefaultBuilding: 'M',

    //Default floor selected within the selected building.
    DefaultFloor: '1',

    //Default watermark text displayed in search box for person search.
    PersonText: "Enter First Name, Last Name, or Both",

    //Default watermark text displayed in search box for place search.
    PlaceText: "Enter Name of Place (Ex. MA)",

    // Set string value to be shown for null or blank values
    ShowNullValueAs: "N/A",

    //Both values should not be same.
    DefaultSearch:
    {
        Person: true, Place: false
    },

    FloorSwitcher:
    {
        IsExpressVisible: true, IsAccordionVisible: false
    },

    IsBasemapSwitcherEnabled: true,

   // ------------------------------------------------------------------------------------------------------------------------
   // Layer details for related Employee table.
   // ------------------------------------------------------------------------------------------------------------------------
      PersonLayer:
         {
         Key: "PersonLayer",
         QueryUrl: "http://localgovtemplates2.esri.com/ArcGIS/rest/services/Facilities/BuildingInterior/MapServer/4",
         OutFields: "OBJECTID,FIRSTNAME,LASTNAME,EMAIL,EXTENSION,BUILDING,FLOOR,WING",
         QueryFields: "FIRSTNAME,LASTNAME",
         WhereQuery: "LOCATION = '${SPACEID}'",
     // ------------------------------------------------------------------------------------------------------------------------
     // INFO-WINDOW SETTINGS
     // ------------------------------------------------------------------------------------------------------------------------

         InfoPopupFieldsCollection:
                      [
					      {
					          DisplayText: "Name:",
					          FieldName: "${FIRSTNAME} ${LASTNAME}",
					          HideCondition: true
					      },
					      {
					          DisplayText: "Email:",
					          FieldName: "${EMAIL}",
					          isLink: true,
                              HideCondition: true
					      },
					      {
					          DisplayText: "Phone:",
					          FieldName: "${EXTENSION}",
					          HideCondition: true
					      },
					      {
					          DisplayText: "Building:",
					          FieldName: "${BUILDING}"
					      },
					      {
					          DisplayText: "Floor:",
					          FieldName: "${FLOOR}"
					      },
					      {
					          DisplayText: "Wing:",
					          FieldName: "${WING}"
					      }
				      ],

         Title: "${SPACETYPE} : ${SPACEID}",
         InfoWindowSize: "270,160"
     }

});