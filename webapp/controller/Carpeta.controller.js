sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, formatter, Filter, FilterOperator) {
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
			var oViewModel,			
			oViewModel = new JSONModel({
                rootUrl: "",
                rootFolder: ""
			});
			this.getView().setModel(oViewModel, "viewModel");
            this.setRepoUrl();

		},

		onPress : function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		_showObject : function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Id")
			});
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
            var that = this;
            this.getData("").then(response => {
                var repos = Object.keys(response).filter(repo => response[repo].repositoryName == "PROCEDIMIENTOS_E_INSTRUCTIVOS");
                var root = repos[0] + "/root";
                var url = this.getDMSUrl("/SDM_API/browser/" + root);
                //this._dmsUrl = url;
                that.getView().getModel("viewModel").setProperty("/rootUrl", url);
                that.getView().getModel("viewModel").setProperty("/rootFolder", root);
                that.getFolderObjects(root);
            });

        },

        getFolderObjects: function (sPath) {
            this.getData(sPath).then(response => {
                console.warn("objects: " + response.objects.length);
            })
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