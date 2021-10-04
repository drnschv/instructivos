sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
    "sap/m/Link",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, formatter, Link, Filter, FilterOperator) {
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
                rootFolder: "",
                repositoryId: "",
                repositoryName: sPath,
                repositoryDescription: "",
			});
			this.getView().setModel(oViewModel, "viewModel");
            this.createFolderModel();
            this.setRepoUrl();

            var oBreadCrumb = this.byId("breadcrumb");
			var oLink = new Link({
				text: sPath,
				press:[sPath, this.onBreadcrumbPress, this]
			});
			oBreadCrumb.addLink(oLink);

		},

		onPress : function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("folderModel");
            //var sName = this.getCmisObjectValue(oContext, "cmis:name");
            var name = this.getCmisObjectName(oContext);
            var objectType = this.getCmisObjectType(oContext);
            var objectId = this.getCmisObjectId(oContext);
            sap.m.MessageToast.show(name + " - " + objectType + " - " + objectId);

            if (objectType === "cmis:folder") {
                var sPath = this.getView().getModel("viewModel").getProperty("/currentPath") + "/" + name;
                this.getFolderObjects(sPath);
                //this.getFolderObjects("F");
            } else if (objectType === "cmis:document") {
                //sap.m.MessageToast.show("Document");
            }
            

			// The source is the list item that got pressed
			//this._showObject(oEvent.getSource());
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


        getDMSUrl: function (sPath) {
            var sComponent = this.getOwnerComponent().getManifest()["sap.app"]["id"]
            return jQuery.sap.getModulePath(sComponent) + sPath;
        },


        getData: function (path) {
            //var url = this.getDMSUrl("/SDM_API/browser");
            //var fullUrl = path ? url + "/" + path : url;
            //return $.get({url: fullUrl});

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
                //resolve(oResponse.getJSON());

            });

        },

        setRepoUrl: function () {
            var sRepositoryName = this.getView().getModel("viewModel").getProperty("/repositoryName"); 
            var that = this;
            this.getData("").then(response => {
                var repos = Object.keys(response).filter(repo => response[repo].repositoryName == sRepositoryName);
                var root = repos[0] + "/root";
                var url = this.getDMSUrl("/SDM_API/browser/" + root);
                //
                that.getView().getModel("viewModel").setProperty("/rootUrl", url);
                that.getView().getModel("viewModel").setProperty("/rootFolder", root);
                that.getView().getModel("viewModel").setProperty("/currentPath", root);
                that.getView().getModel("viewModel").setProperty("/repositoryId", response[repos[0]].repositoryId);
                that.getView().getModel("viewModel").setProperty("/repositoryName", response[repos[0]].repositoryName);
                that.getView().getModel("viewModel").setProperty("/repositoryDescription", response[repos[0]].repositoryDescription);
                that.getFolderObjects(root);  
            });

        },

        getFolderObjects: function (sPath) {
            var that = this;
            this.getData(sPath).then(response => {
                that.getView().getModel("folderModel").setData(response);
            })
        },



        onBreadcrumbPress: function (oEvent, sPath) {
			var oLink = oEvent.getSource();
			var oBreadCrumb = this.byId("breadcrumb");
			var iIndex = oBreadCrumb.indexOfLink(oLink);
			var aCrumb = oBreadCrumb.getLinks().slice(iIndex + 1);
			if (aCrumb.length) {
				aCrumb.forEach(function(oLink) {
					oLink.destroy();
				});
				//this._setAggregation(sPath);
			}
		},


        getAdjuntos: function (oResponse) {
            var aObjects = [];
            for(var i=0; i < oResponse.objects.length; i++) {
                var oFolderContent = {};
                var oObjectAttributes = {};
                oFolderContent = oResponse.objects[i].object.properties;
                oObjectAttributes.name = oFolderContent["cmis:name"].value;
                oObjectAttributes.type = oFolderContent["cmis:objectTypeId"].value; 
                aObjects.push(oObjectAttributes);
            }
            return aObjects;

        },


		

	});
});