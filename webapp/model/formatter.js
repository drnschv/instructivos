sap.ui.define([], function () {
	"use strict";

	return {

		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		sizeVisible: function (sType) {
			return (sType === "cmis:document") ? true : false;
		},

		formatMSDate: function (sMSDate) {
			var d = new Date(sMSDate);
			//return d.toDateString();
			return d.toLocaleDateString();

		},

		formatObjectType: function (sName, sType) {
			var sIcon = "sap-icon://document";
			var sExtension = sName.split('.').pop();
			
			if (sType === "cmis:document") {
				switch (sExtension) { 
					case 'pdf':
						sIcon = "sap-icon://pdf-attachment";
						break;
					case 'xls':
					case 'xlsx':
						sIcon = "sap-icon://excel-attachment";
						break;
					case 'ppt':
						sIcon = "sap-icon://ppt-attachment";
						break;
					case 'txt':
						sIcon = "sap-icon://attachment-text-file";
						break;
					case 'png':
					case 'jpg':
					case 'jpeg':
					case 'bmp':
						sIcon = "sap-icon://attachment-photo";
						break;
					case 'doc':
					case 'docx':
						sIcon = "sap-icon://doc-attachment";
						break;
					case 'zip':
						sIcon = "sap-icon://attachment-zip-file";
						break;
					case 'mp4': 
					case 'mpeg': 
						sIcon = "sap-icon://attachment-video";
						break;
					case 'opus': 
					case 'mp3':
						sIcon = "sap-icon://attachment-audio";
						break;

				}
				
			}

			if (sType === "cmis:folder") {
				sIcon = "sap-icon://open-folder";
			}

			return sIcon;
		}

        

	};
});