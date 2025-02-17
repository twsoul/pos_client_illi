/**
 * Created by KangHyungWon on 2016. 1. 13..
 */
var userManager = (function() {
	var userDataInstance;

	try {
		userDataInstance = M.sec.decrypt(dataManager.storage('userData'));

		if ( userDataInstance.status == 'FAIL' ) {
			throw userDataInstance.status;
		}

		userDataInstance = JSON.parse(userDataInstance.result);
	} catch(e) {
		userDataInstance = dataManager.storage('userData');
	}

	var setUserData = function (userData) {
		try {
			var encUserData = M.sec.encrypt(JSON.stringify(userData));

			if (encUserData.status == 'FAIL') {
				throw encUserData.status;
			}

			if (Utils.isJson(encUserData.result)) {
				throw encUserData.result;
			}

			dataManager.storage('userData', encUserData.result);
		} catch (e) {
			dataManager.storage('userData', userData);
		}

		userDataInstance = dataManager.storage('userData');

		return M.sec.decrypt(userDataInstance).result;
	};

	var removeUserData = function () {
		dataManager.removeStorage('userData');
	}

	var getUserDataForKey = function (key) {
		if (!userDataInstance) {
			return '';
		}

		return userDataInstance[key];
	};



	var getUSER_ID = function() {
		return getUserDataForKey('USER_ID');
	};

	var getLOGIN_STAT = function() {
		return getUserDataForKey('LOGIN_STAT');
	};

	var getDEPT_CD = function() {
		return getUserDataForKey('DEPT_CD');
	};

	var getWK_TEAM = function() {
		return getUserDataForKey('WK_TEAM');
	};

	var getUSER_NM = function() {
		return getUserDataForKey('USER_NM');
	};

    var getTEL_NO = function() {
    	return getUserDataForKey('TEL_NO');
    };

	var getMOBILE_NO = function() {
		return getUserDataForKey('MOBILE_NO');
	};

	var getREMARK = function() {
		return getUserDataForKey("REMARK");
	};

	var getUSE_YN = function() {
		return getUserDataForKey("USE_YN");
	};

    var getCORP_CD = function() {
    	return getUserDataForKey('CORPORATE_CD');
    };

	var getVEND_CD = function() {
		return getUserDataForKey('VENDOR_CD');
	};

	var getPLANT_CD = function() {
		return getUserDataForKey('PLANT_CD');
	};

	var getUPPER = function() {
    	return getUserDataForKey('UPPER_FLAG');
    };

	return {
		setUserData:    	setUserData,
		removeUserData:	    removeUserData,
		getUSER_ID:		    getUSER_ID,
		getLOGIN_STAT:	    getLOGIN_STAT,
		getDEPT_CD:		    getDEPT_CD,
		getWK_TEAM:	        getWK_TEAM,
		getUSER_NM:		    getUSER_NM,
		getTEL_NO:		    getTEL_NO,
		getMOBILE_NO:       getMOBILE_NO,
		getREMARK:          getREMARK,
		getUSE_YN:          getUSE_YN,
		getCORP_CD:         getCORP_CD,
		getVEND_CD:         getVEND_CD,
		getPLANT_CD:        getPLANT_CD,
		getUPPER:           getUPPER
	};
})();
