/**
 * Created by Jae-Min Jo on 2021. 05. 14..
 */
var optionManager = (function() {

    var selGB = function(element) {
        if(element.SET_KEY === 'selGB')  {
            return true;
        }
    };
    var selSJ = function(element) {
        if(element.SET_KEY === 'selSJ')  {
            return true;
        }
    };
    var selJJ = function(element) {
        if(element.SET_KEY === 'selJJ')  {
            return true;
        }
    };
    var selPLANT = function(element) {
        if(element.SET_KEY === 'selPLANT')  {
            return true;
        }
    };
    var selPLOC = function(element) {
        if(element.SET_KEY === 'selPLOC')  {
            return true;
        }
    };
    var selPLOC20 = function(element) {
        if(element.SET_KEY === 'selPLOC20')  {
            return true;
        }
    };
    var selLNG = function(element) {
        if(element.SET_KEY === 'selLNG')  {
            return true;
        }
    };
    var txtTERM = function(element) {
        if(element.SET_KEY === 'txtTERM')  {
            return true;
        }
    };
    var chkSCAN = function(element) {
        if(element.SET_KEY === 'chkSCAN')  {
            return true;
        }
    };
    var chkTEST = function(element) {
        if(element.SET_KEY === 'chkTEST')  {
            return true;
        }
    };

	var getOptionDataForKey = function (key) {

	    var OptionList = JSON.parse(dataManager.storage(userManager.getUSER_ID())).find(key);
		return OptionList.SET_VALUE;
	};

    var getZPROC = function () {//selGB
        return getOptionDataForKey(selGB);
    };
    var getTPLNR = function () {//selSJ
        return getOptionDataForKey(selSJ);
    };
    var getARBPL = function () {//selJJ
        return getOptionDataForKey(selJJ);
    };
    var getWERKS = function () {//selPLANT
        return getOptionDataForKey(selPLANT);
    };
    var getLGORT = function () {//selPLOC
        return getOptionDataForKey(selPLOC);
    };
    var getLGORT20 = function () {//selPLOC20
        return getOptionDataForKey(selPLOC20);
    };
    var getLNG = function () {//selLNG
        return getOptionDataForKey(selLNG);
    };
    var getABRHO = function () {//txtTERM
        return getOptionDataForKey(txtTERM);
    };
    var getSCAN = function () {//chkSCAN
        return getOptionDataForKey(chkSCAN);
    };
    var getTEST = function () {//chkTEST
        return getOptionDataForKey(chkTEST);
    };

	return {
		getZPROC:    	getZPROC,
		getTPLNR:	    getTPLNR,
		getARBPL:	    getARBPL,
		getWERKS:		getWERKS,
		getLGORT:       getLGORT,
		getLGORT20:     getLGORT20,
		getLNG:		    getLNG,
		getABRHO:       getABRHO,
		getSCAN:	    getSCAN,
		getTEST:	    getTEST
	};
})();
