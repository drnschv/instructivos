sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
    "sap/m/Link",
    "sap/m/MenuItem"
], function (Controller, JSONModel, formatter, Link, MenuItem) {
	"use strict";

	return Controller.extend("profertil.instructivos.controller.Carpeta", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
            var sPath = "PROCEDIMIENTOS_E_INSTRUCTIVOS";

			var oViewModel,			
			oViewModel = new JSONModel({
                rootUrl: "",
                rootFolderPath: "",
                repositoryId: "",
                repositoryName: sPath,
                repositoryDescription: "Carpetas",
			});
			this.getView().setModel(oViewModel, "viewModel");
            
            this.createFolderModel();
            this.setRepoUrl();
            this.addBreadcumbPath(sPath);
           
		},


        onMenuAction: function (oEvent) {
            var oItem = oEvent.getParameter("item");
			var sItemPath = "";
            while (oItem instanceof MenuItem) {
                sItemPath = oItem.getText() + " > " + sItemPath;
                oItem = oItem.getParent();
            }
            sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));
            //sap.m.MessageToast.show("Seleccion: " + sItemPath);
            var sNewFolder = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("newfolder");
            var sNewFile = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("newfile");
            if (sItemPath === sNewFolder) {
                sap.m.MessageToast.show("new Folder");
            }

            if (sItemPath === sNewFile) {
                sap.m.MessageToast.show("new File");
            }

        },

        onUpdateStarted: function (oEvent) {
            //var oTable = this.byId("tableContent");
            //var oItems = oTable.getBinding("items");
			//var oBindingPath = table.getModel().getProperty("/object/properties/cmis:objectTypeId/value");
			//var oSorter = new Sorter(oBindingPath);
			//oItems.sort(oSorter);

        },


		onPress : function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("folderModel");
            var name = this.getCmisObjectName(oContext);
            var objectType = this.getCmisObjectType(oContext);
            var objectId = this.getCmisObjectId(oContext);

            if (objectType === "cmis:folder") {
                this.addBreadcumbPath(name);
                var sPath = this.getCurrentFullPath();
                this.getFolderObjects(sPath);
            } else if (objectType === "cmis:document") {
                //sap.m.MessageToast.show("Document");
                //download document
            } else {
                sap.m.MessageToast.show("Object not found");
            }

		},
        
        onBreadcrumbPress: function (oEvent, sLinkText) {
			var oLink = oEvent.getSource();
			var oBreadCrumb = this.byId("breadcrumb");
			var iIndex = oBreadCrumb.indexOfLink(oLink);
			var aCrumb = oBreadCrumb.getLinks().slice(iIndex + 1);
			if (aCrumb.length) {
				aCrumb.forEach(function(oLink) {
					oLink.destroy();
				});
			} 
            var sPath = this.getCurrentFullPath();
            this.getFolderObjects(sPath);

		},

        getCurrentFullPath: function () {
            var sFullPath = "";
            var sBreadcumbPath = this.getBreadcumbPath();
            var sRootPath = this.getView().getModel("viewModel").getProperty("/rootFolderPath");
            sFullPath = sRootPath + sBreadcumbPath;
            return sFullPath;

        },

        addBreadcumbPath: function (sPath) {
            var oBreadCrumb = this.byId("breadcrumb");
			var oLink = new Link({
				text: sPath,
				press:[sPath, this.onBreadcrumbPress, this]
			});
			oBreadCrumb.addLink(oLink);
        },

        getBreadcumbPath: function () {
            var aLinks = [];
            var sPath = "";
            aLinks = this.getBreadcumbLinks();
            for (var i=1; i < aLinks.length; i++) {
                sPath = sPath +"/" + aLinks[i].getProperty("text");
            }
            return sPath;
        },

        getBreadcumbLinks: function () {
            var oBreadCrumb = this.byId("breadcrumb");
			return oBreadCrumb.getLinks();
        },

        getCmisObjectName: function (oContext) {
            return this.getCmisObjectValue(oContext, "cmis:name");
        },
        getCmisObjectId: function (oContext) {
            return this.getCmisObjectValue(oContext, "cmis:objectId");
        },
        getCmisObjectType: function (oContext) {
            return this.getCmisObjectValue(oContext, "cmis:objectTypeId");
        },                                            
        getCmisParentId: function (oContext) {
            return this.getCmisObjectValue(oContext, "sap:parentIds");
        },        
        getCmisObjectValue: function (oContext, sTag) {
            var sPath=oContext.getPath();
            var oCmisObject = oContext.getProperty(sPath); 
            return oCmisObject.object.properties[sTag].value;           
        },

        createFolderModel: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "folderModel");
        },



        //
        //
        //
        createFolder: function (foldername, path) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "createFolder",
                "propertyId[0]": "cmis:name",
                "propertyId[1]": "cmis:objectTypeId",
                "propertyValue[0]": foldername,
                "propertyValue[1]": "cmis:folder"
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            return $.ajax({
                url: sDmsUrl + (!path ? "" : path),
                type: "POST",
                data: data,
                contentType: false,
                processData: false
            });
        },

        deleteFolderTree: function (sRepoId, sFolderId) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "deleteTree",
                "propertyId[0]": "cmis:repositoryId",
                "propertyValue[0]": sRepoId,                
                "propertyId[1]": "cmis:folderId",
                "propertyValue[1]": sFolderId,
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            $.ajax({
                url: sDmsUrl + path,
                type: "POST",  //es DELETE ? 
                data: data,
                contentType: false,
                processData: false
            });
        },




        //
        //
        //
        getFolderObjects: function (sPath) {
            var that = this;
            this.getData(sPath).then(response => {
                that.getView().getModel("folderModel").setData(response);
            })
        },

        getDMSUrl: function (sPath) {
            var sComponent = this.getOwnerComponent().getManifest()["sap.app"]["id"]
            return jQuery.sap.getModulePath(sComponent) + sPath;
        },


        getData: function (path) {
            var url = this.getDMSUrl("/SDM_API/browser");
            var fullUrl = path ? url + "/" + path : url;
            return $.get({url: fullUrl});

        },

        setRepoUrl: function () {
            var sRepositoryName = this.getView().getModel("viewModel").getProperty("/repositoryName"); 
            var that = this;
            this.getData("").then(response => {
                var repos = Object.keys(response).filter(repo => response[repo].repositoryName == sRepositoryName);
                var root = repos[0] + "/root";
                var url = this.getDMSUrl("/SDM_API/browser/" + root); //this._dmsUrl=.../browser/<repoId>/root
                //
                that.getView().getModel("viewModel").setProperty("/rootUrl", url);
                that.getView().getModel("viewModel").setProperty("/rootFolderPath", root);
                that.getView().getModel("viewModel").setProperty("/repositoryId", response[repos[0]].repositoryId);
                that.getView().getModel("viewModel").setProperty("/repositoryName", response[repos[0]].repositoryName);
                that.getView().getModel("viewModel").setProperty("/repositoryDescription", response[repos[0]].repositoryDescription);
                that.getFolderObjects(root);  
            });

        },

        


        

		

	});
});



/*
 * 
             return new Promise(function (resolve, reject) {
                
                var oResponse = new sap.ui.model.json.JSONModel();
                oResponse.attachRequestCompleted(function() {
                    resolve(oResponse.getData());
                });

                if (path === "") {
                    oResponse.loadData("../localService/xroot.json"); 
                } else if (path === "C"){
                    oResponse.loadData("../localService/xfolders.json"); 
                } else if (path === "F") {
                    oResponse.loadData("../localService/xfiles.json");
                } else {
                    oResponse.loadData("../localService/xfolders.json");
                }

            });

//getAdjuntos: function (oResponse) {
        //    var aObjects = [];
        //    for(var i=0; i < oResponse.objects.length; i++) {
        //        var oFolderContent = {};
        //        var oObjectAttributes = {};
        //        oFolderContent = oResponse.objects[i].object.properties;
        //        oObjectAttributes.name = oFolderContent["cmis:name"].value;
        //        oObjectAttributes.type = oFolderContent["cmis:objectTypeId"].value; 
        //        aObjects.push(oObjectAttributes);
        //    }
        //    return aObjects;
        //},


 */
