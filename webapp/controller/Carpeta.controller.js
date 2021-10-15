sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/Link",
    "sap/m/MenuItem",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], function (Controller, JSONModel, formatter, Link, MenuItem, Fragment, MessageBox) {
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
        onInit: function () {
            var sPath = "PROCEDIMIENTOS_E_INSTRUCTIVOS";
            //var sPath = "RECLAMOS";
            //var sPath = "DOC_IMPOSITIVA";
            //var sPath = "INFORME_PAGOS";
            
            var oViewModel,
                oViewModel = new JSONModel({
                    rootUrl: "",
                    rootFolderPath: "",
                    repositoryId: "",
                    repositoryName: sPath,
                    repositoryDescription: "Carpetas",
                    newFolderName: "",
                    newFileName: "",
                    newLinkName: "",
                    newLinkUrl: "",
                    userName: "",
                    userMail: "",
                    userId: ""

                });
            this.getView().setModel(oViewModel, "viewModel");
            this.createFolderModel();
            this.setRepoUrl();
            this.addBreadcumbPath(sPath);
            this.getUserInfo();

        },

        getUserInfo: function () {
            if (typeof sap.ushell === "undefined") {
                this.getView().getModel("viewModel").setProperty("/userName", "Default User");
                this.getView().getModel("viewModel").setProperty("/userMail", "default@mail");
                this.getView().getModel("viewModel").setProperty("/userId", "");
                return;
            }
            sap.ushell.Container.getServiceAsync("UserInfo")
            .then(function (UserInfo) {
                this.getView().getModel("viewModel").setProperty("/userName", UserInfo.getFullName());
                this.getView().getModel("viewModel").setProperty("/userMail", UserInfo.getEmail());
                this.getView().getModel("viewModel").setProperty("/userMail", UserInfo.getId());
            }.bind(this))
            .catch(function () {
                this.getView().getModel("viewModel").setProperty("/userName", "Default User");
                this.getView().getModel("viewModel").setProperty("/userMail", "default@mail");
                this.getView().getModel("viewModel").setProperty("/userId", "");
            }.bind(this));

        },
        
        onMenuAction: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sItemPath = "";
            while (oItem instanceof MenuItem) {
                sItemPath = oItem.getText() + " > " + sItemPath;
                oItem = oItem.getParent();
            }
            sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));
            var sNewFolder = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("newfolder");
            var sNewFile = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("newfile");
            var sNewLink = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("newlink");
            
            if (sItemPath === sNewFolder) {
                this.displayCreateFolder();
            }

            if (sItemPath === sNewFile) {
                this.displayUploadFile();
            }

            if (sItemPath === sNewLink) {
                this.displayCreateLink();
            }

        },

        displayCreateLink: function () {
            if (!this._oCrearLink) {
                Fragment.load({
                    type: "XML",
                    controller: this,
                    name: 'profertil.instructivos.view.CrearLink'
                }).then(function (oFragment) {
                    this._oCrearLink = oFragment;
                    this.getView().addDependent(this._oCrearLink);
                    this._oCrearLink.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewModel").setProperty("/newLinkName", "");
                this.getView().getModel("viewModel").setProperty("/newLinkUrl", "");
                this._oCrearLink.open();
            }

        },

        onPressCrearLink: function (oEvent) {
            var sPath = this.getBreadcumbPath();
            var sLinkName = this.getView().getModel("viewModel").getProperty("/newLinkName");
            var sLinkUrl = this.getView().getModel("viewModel").getProperty("/newLinkUrl");
            if (sLinkName === "" || sLinkUrl === "") {
                return;
            }
            this._oCrearLink.close();
            this.setViewBusy(true);    
            this.createLink(sLinkName, sLinkUrl, sPath)
                .then(function () {
                    this.onRefreshContent();
                }.bind(this))
                .catch(function (oError) {
                    this.setViewBusy(false);
                    sap.m.MessageToast.show(oError.status + ": " + oError.responseJSON.message);
                }.bind(this));

        },

        onPressCancelarLink: function () {
            this._oCrearLink.close();
        },

        displayUploadFile: function () {
            if (!this._oUploadFile) {
                Fragment.load({
                    type: "XML",
                    controller: this,
                    name: 'profertil.instructivos.view.UploadFile'
                }).then(function (oFragment) {
                    this._oUploadFile = oFragment;
                    this.getView().addDependent(this._oUploadFile);
                    this._oUploadFile.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewModel").setProperty("/newFileName", "");
                this._oUploadFile.open();
            }
        },

        onFileChange: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            this._fileName = oFile.name;
            this._file = oEvent.getParameter("files")[0];
        },


        onUploadFile: function () {
            var sPath = this.getBreadcumbPath();
            var sFileName = this.getView().getModel("viewModel").getProperty("/newFileName");
            if (sFileName === "") {
                return;
            }
            this._oUploadFile.close();
            this.setViewBusy(true);
            var that = this;
            this.createFile(sPath, sFileName).then(function () {
                that.onRefreshContent();
            }).catch(function (oError) {
                that.setViewBusy(false);
                sap.m.MessageToast.show(oError.status + ": " + oError.responseJSON.message);
            });

        },

        onCancelarUploadFile: function () {
            this._oUploadFile.close();
        },



        displayCreateFolder: function () {
            if (!this._oCrearCarpeta) {
                Fragment.load({
                    type: "XML",
                    controller: this,
                    name: 'profertil.instructivos.view.CrearCarpeta'
                }).then(function (oFragment) {
                    this._oCrearCarpeta = oFragment;
                    this.getView().addDependent(this._oCrearCarpeta);
                    this._oCrearCarpeta.open();
                }.bind(this));
            } else {
                this.getView().getModel("viewModel").setProperty("/newFolderName", "");
                this._oCrearCarpeta.open();
            }

        },

        onPressCrearCarpeta: function (oEvent) {
            var sPath = this.getBreadcumbPath();
            var sFolderName = this.getView().getModel("viewModel").getProperty("/newFolderName");
            if (sFolderName === "") {
                return;
            }
            this._oCrearCarpeta.close();
            this.setViewBusy(true);    
            this.createFolder(sFolderName, sPath).then(function () {
                this.onRefreshContent();
            }.bind(this)).catch(function (oError) {
                this.setViewBusy(false);
                sap.m.MessageToast.show(oError.status + ": " + oError.responseJSON.message);
            });

        },

        onPressCancelarCarpeta: function (oEvent) {
            this._oCrearCarpeta.close();
        },

        onPressDeleteObject: function (oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext("folderModel");
            var sType = this.getCmisObjectType(oContext);
            MessageBox.warning("Desea eliminar el objeto?", {
                actions: ["Eliminar", "Cancelar"],
                initialFocus: "Cancelar",
                onClose: function (sAction) {
                    if (sAction === "Eliminar" && sType === "cmis:folder") {
                        this.deleteCmisfolder(oContext);
                    }
                    if (sAction === "Eliminar" && sType === "cmis:document") {
                        this.deleteCmisdocument(oContext);
                    }
                    if (sAction === "Eliminar" && sType === "sap:link") {
                        this.deleteCmisdocument(oContext);
                    }
                }.bind(this)
            });

        },

        deleteCmisfolder: function (oContext) {
            this.setViewBusy(true);
            var objectId = this.getCmisObjectId(oContext);
            this.deleteFolderTree(objectId).then(function () {
                this.onRefreshContent();
            }.bind(this)).catch(function () {
                this.setViewBusy(false);
                sap.m.MessageToast.show("Error al intentar eliminar el objeto. Intente mas tarde")
            }.bind(this));

        },

        deleteCmisdocument: function (oContext) {
            var objectId = this.getCmisObjectId(oContext);
            this.setViewBusy(true);
            this.deleteDocumentFile(objectId).then(function () {
                this.onRefreshContent();
            }.bind(this)).catch(function (oError) {
                this.setViewBusy(false);
                sap.m.MessageToast.show(oError.status + ": " + oError.responseJSON.message);
            }.bind(this));

        },

        onRefreshContent: function () {
            var sPath = this.getCurrentFullPath();
            this.getFolderObjects(sPath);
        },


        onUpdateStarted: function (oEvent) {
            //var oTable = this.byId("tableContent");
            //var oItems = oTable.getBinding("items");
            //var oBindingPath = table.getModel().getProperty("/object/properties/cmis:objectTypeId/value");
            //var oSorter = new Sorter(oBindingPath);
            //oItems.sort(oSorter);
        },

        // press en una carpeta o archivo
        onPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("folderModel");
            var name = this.getCmisObjectName(oContext);
            var objectType = this.getCmisObjectType(oContext);
            var objectId = this.getCmisObjectId(oContext);

            if (objectType === "cmis:folder") {
                this.addBreadcumbPath(name);
                var sPath = this.getCurrentFullPath();
                this.getFolderObjects(sPath);
            } else if (objectType === "cmis:document") {
                this.downloadDocumentFile(objectId, name);
            } else if (objectType === "sap:link") { 
                this.followLink(objectId, name).then(function (response) {
                    var sUrl = response.split("=")[1];
                    window.open(sUrl);
                }).catch( function (oError){
                    console.log(oError.responseJSON.message);
                });
            } else {
                sap.m.MessageToast.show("Object not found");
            }

        },

        // press en el breadcumb path
        onBreadcrumbPress: function (oEvent, sLinkText) {
            var oLink = oEvent.getSource();
            var oBreadCrumb = this.byId("breadcrumb");
            var iIndex = oBreadCrumb.indexOfLink(oLink);
            var aCrumb = oBreadCrumb.getLinks().slice(iIndex + 1);
            if (aCrumb.length) {
                aCrumb.forEach(function (oLink) {
                    oLink.destroy();
                });
            }
            var sPath = this.getCurrentFullPath();
            this.getFolderObjects(sPath);

        },

        // press en boton back folder
        onBackFolderPress: function (oEvent) {
            var oBreadCrumb = this.byId("breadcrumb");
            var iLength = oBreadCrumb.getLinks().length;
            if (iLength === 1) {
                return;
            }
            var aCrumb = oBreadCrumb.getLinks().slice(iLength - 1);
            if (aCrumb.length) {
                aCrumb.forEach(function (oLink) {
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
                press: [sPath, this.onBreadcrumbPress, this]
            });
            oBreadCrumb.addLink(oLink);
        },

        getBreadcumbPath: function () {
            var aLinks = [];
            var sPath = "";
            aLinks = this.getBreadcumbLinks();
            for (var i = 1; i < aLinks.length; i++) {
                sPath = sPath + "/" + aLinks[i].getProperty("text");
            }
            return sPath;
        },

        getBreadcumbLinks: function () {
            var oBreadCrumb = this.byId("breadcrumb");
            return oBreadCrumb.getLinks();
        },

        getRepositoryId: function () {
            return this.getView().getModel("viewModel").getProperty("/repositoryId");
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
            var sPath = oContext.getPath();
            var oCmisObject = oContext.getProperty(sPath);
            return oCmisObject.object.properties[sTag].value;
        },

        createFolderModel: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "folderModel");
        },



        //------------------------------------------
        //
        //------------------------------------------
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

        deleteFolderTree: function (sFolderId) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "deleteTree",
                "continueOnFailure": false,
                "objectId": sFolderId
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            return $.ajax({
                url: sDmsUrl,
                type: "POST",
                data: data,
                contentType: false,
                processData: false
            });

        },

        deleteDocumentFile: function (sObjectId) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "delete",
                "objectId": sObjectId
            };

            var keys = Object.keys(dataObject);

            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            return $.ajax({
                url: sDmsUrl,
                type: "POST",
                data: data,
                contentType: false,
                processData: false
            });

        },

        downloadDocumentFile: function (sObjectId, sFileName) {
            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            var sObjectUri = sDmsUrl + "?objectId=" + sObjectId + "&cmisSelector=content&download=attachment&filename=" + sFileName;
            window.open(sObjectUri, "_blank");
        },

        followLink: function (sObjectId, sFileName) {
            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");
            var sObjectUri = sDmsUrl + "?objectId=" + sObjectId + "&cmisSelector=content";
            return $.ajax({
                url: sObjectUri,
                type: "GET"
            });

        },

        createFile: function (sPath, sFileName) {
            var data = new FormData();
            var dataObject = {
                "cmisaction": "createDocument",
                "propertyId[0]": "cmis:name",
                "propertyValue[0]": sFileName,   	                    
                "propertyId[1]": "cmis:objectTypeId",
                "propertyValue[1]": "cmis:document",
                "media": this._file,   			// viene de onFileChange
            }

            var keys = Object.keys(dataObject);
            for (var key of keys) {
                data.append(key, dataObject[key]);
            }

            var sDmsUrl = this.getView().getModel("viewModel").getProperty("/rootUrl");

            return $.ajax({
                url: sDmsUrl + (!sPath ? "" : sPath),
                type: "POST",
                data: data,
                contentType: false,
                processData: false
            });

        },

        createLink: function (sLinkName, sLinkUrl, path) {
            var sLinkNameFinal = sLinkName + ".url";
            var data = new FormData();
            var dataObject = {
                "cmisaction": "createDocument",
                "propertyId[0]": "cmis:name",
                "propertyValue[0]": sLinkNameFinal,
                "propertyId[1]": "cmis:objectTypeId",
                "propertyValue[1]": "cmis:document",
                "propertyId[2]": "cmis:secondaryObjectTypeIds",
                "propertyValue[2]": "sap:createLink",
                "propertyId[3]": "sap:linkExternalURL",
                "propertyValue[3]": sLinkUrl
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

        setViewBusy: function (sValue) {
            var bBusy = this.getView().getBusy();            
            if ( (sValue && bBusy) || (!sValue && !bBusy) ) {
                return;
            }
            if (sValue && !bBusy) {
                this.getView().setBusy(true);
            }
            if (!sValue && bBusy) {
                this.getView().setBusy(false);
            }

        },

        addAttributes: function (response) {
            for (var i=0; i < response.objects.length; i++) {
                var sType = response.objects[i].object.properties["cmis:objectTypeId"].value;
                if (sType === "cmis:folder") {
                    response.objects[i].object.properties.order = "A";
                }
                if (sType === "cmis:document") {
                    response.objects[i].object.properties.order = "B";
                }
                if (sType === "sap:link") {
                    response.objects[i].object.properties.order = "C";
                }    
            }
            
        },

        //
        //
        //
        getFolderObjects: function (sPath) {
            this.setViewBusy(true);
            var that = this;
            this.getData(sPath).then(response => {
                that.addAttributes(response);
                that.getView().getModel("folderModel").setData(response);
                that.setViewBusy(false);
            }).catch(oError => {
                that.setViewBusy(false);
            });

        },

        getDMSUrl: function (sPath) {
            var sComponent = this.getOwnerComponent().getManifest()["sap.app"]["id"]
            return jQuery.sap.getModulePath(sComponent) + sPath;
        },


        getData: function (path) {
            var url = this.getDMSUrl("/SDM_API/browser");
            var fullUrl = path ? url + "/" + path : url;
            return $.get({ url: fullUrl });

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
